/**
 * Controlador del Mapa Cartográfico en MapLibre GL JS
 * Conforme a SPEC-04, SPEC-06 y SPEC-07 (pkg/viz & pkg/curvilinear)
 * Renderizado Resiliente del Eje, Puntos de Siniestros y Perfil Curvilíneo
 */

import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { VizStore } from '../pkg/viz/store.js';
import { buildMapLibreConfig } from '../pkg/viz/maplibre-adapter.js';
import { generateCurvilinearProfile } from '../pkg/curvilinear/generator.js';
import { buildCurvilinearMapLibreLayers } from '../pkg/curvilinear/maplibre-layers.js';
import { VizStoreState, VizEvent } from '../pkg/viz/types.js';

// Configurar explícitamente el worker de MapLibre GL JS para Vite (ES Module Worker)
if (typeof (maplibregl as any).setWorkerUrl === 'function') {
  (maplibregl as any).setWorkerUrl(maplibreWorkerUrl);
}

export class MapViewController {
  private map: maplibregl.Map;
  private store: VizStore;
  private popup: maplibregl.Popup;
  private isLoaded: boolean = false;

  constructor(containerId: string, store: VizStore) {
    this.store = store;
    this.popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12
    });

    // Estilo base libre de MapLibre (OpenFreeMap / OSM)
    const baseStyle: any = {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    };

    this.map = new maplibregl.Map({
      container: containerId,
      style: baseStyle,
      center: [-76.9450, -12.2100], // Coordenadas centrales del corredor Panamericana Sur
      zoom: 13,
      attributionControl: { compact: true }
    });

    (window as any).mapInstance = this.map;

    this.map.addControl(new maplibregl.NavigationControl(), 'top-left');

    // Capturar avisos internos de MapLibre sin romper la app
    this.map.on('error', (e) => {
      console.warn('Evento interno MapLibre:', e);
    });

    // Inicialización resiliente e idempotente de capas
    const setupLayersAndData = () => {
      if (this.isLoaded) return;
      this.isLoaded = true;

      try {
        this.initLayers();
        this.updateView();
        this.map.resize();
        this.fitToAlignment();
        console.log('Capas cartográficas y perfil curvilíneo inicializados exitosamente (SPEC-07).');
      } catch (err) {
        console.error('Error inicializando capas cartográficas:', err);
      }
    };

    this.map.on('load', setupLayersAndData);
    this.map.on('style.load', setupLayersAndData);

    // Si el estilo ya estuviera cargado en memoria, inicializar directamente
    if (this.map.isStyleLoaded() || this.map.loaded()) {
      setupLayersAndData();
    } else {
      setTimeout(() => {
        if (!this.isLoaded && this.map.isStyleLoaded()) {
          setupLayersAndData();
        }
      }, 350);
    }

    this.setupInteractions();

    // Suscribirse a cambios del store reactivo
    this.store.subscribe((state, event) => {
      if (!this.isLoaded) {
        if (this.map.isStyleLoaded()) {
          setupLayersAndData();
        }
        return;
      }

      if (
        event.type === 'ALIGNMENT_CHANGED' ||
        event.type === 'LRS_RECALCULATED' ||
        event.type === 'CONFIG_UPDATED' ||
        event.type === 'FILTERS_UPDATED'
      ) {
        this.updateView();
      } else if (
        event.type === 'BIN_HOVER' ||
        event.type === 'BIN_SELECT' ||
        event.type === 'CRASH_HOVER' ||
        event.type === 'SELECTION_CLEARED'
      ) {
        this.updateHighlightLayer(
          state.selection.highlightedStationRange,
          state.selection.hoveredBinIndex ?? state.selection.selectedBinIndex
        );
      }
    });
  }

  private initLayers(): void {
    const state = this.store.getState();
    if (!state.alignment || !state.lrsResults) return;

    // 1. Capas base de alineamiento y corredor
    const corridorConfig = buildMapLibreConfig(state.alignment, state.lrsResults);
    for (const src of corridorConfig.sources) {
      try {
        if (!this.map.getSource(src.id)) {
          this.map.addSource(src.id, { type: src.type, data: src.data } as any);
        }
      } catch (e) {
        console.warn(`Error agregando fuente ${src.id}:`, e);
      }
    }
    for (const layer of corridorConfig.layers) {
      try {
        if (!this.map.getLayer(layer.id)) {
          this.map.addLayer(layer as any);
        }
      } catch (e) {
        console.warn(`Error agregando capa ${layer.id}:`, e);
      }
    }

    // 2. Capas del Perfil Curvilíneo Paralelo al Trazo (VisQuill A1 Collision Density)
    const curvModel = generateCurvilinearProfile(state.alignment, state.lrsResults, {
      offsetDistanceMeters: state.config.curvilinearOffsetMeters,
      side: state.config.curvilinearSide,
      heightScaleMetersPerUnit: state.config.curvilinearHeightScale,
      metricMode: state.config.metricMode
    });
    const curvBundle = buildCurvilinearMapLibreLayers(
      curvModel,
      state.selection.hoveredBinIndex ?? state.selection.selectedBinIndex
    );

    for (const src of curvBundle.sources) {
      try {
        if (!this.map.getSource(src.id)) {
          this.map.addSource(src.id, { type: src.type, data: src.data } as any);
        }
      } catch (e) {
        console.warn(`Error agregando fuente curvilínea ${src.id}:`, e);
      }
    }
    for (const layer of curvBundle.layers) {
      try {
        if (!this.map.getLayer(layer.id)) {
          this.map.addLayer(layer as any);
        }
      } catch (e) {
        console.warn(`Error agregando capa curvilínea ${layer.id}:`, e);
      }
    }
  }

  private updateView(): void {
    const state = this.store.getState();
    if (!state.alignment || !state.lrsResults) return;

    const activeBinIndex = state.selection.hoveredBinIndex ?? state.selection.selectedBinIndex;

    // 1. Actualizar capas de alineamiento y corredor
    const corridorConfig = buildMapLibreConfig(
      state.alignment,
      state.lrsResults,
      state.selection.highlightedStationRange
    );

    for (const src of corridorConfig.sources) {
      try {
        const existingSource = this.map.getSource(src.id) as maplibregl.GeoJSONSource;
        if (existingSource) {
          existingSource.setData(src.data);
        } else {
          this.map.addSource(src.id, { type: src.type, data: src.data } as any);
        }
      } catch (e) {
        console.warn(`Error actualizando fuente ${src.id}:`, e);
      }
    }
    for (const layer of corridorConfig.layers) {
      try {
        if (!this.map.getLayer(layer.id)) {
          this.map.addLayer(layer as any);
        }
      } catch (e) {
        console.warn(`Error verificando capa ${layer.id}:`, e);
      }
    }

    // 2. Actualizar capas del perfil curvilíneo
    const curvModel = generateCurvilinearProfile(state.alignment, state.lrsResults, {
      offsetDistanceMeters: state.config.curvilinearOffsetMeters,
      side: state.config.curvilinearSide,
      heightScaleMetersPerUnit: state.config.curvilinearHeightScale,
      metricMode: state.config.metricMode
    });
    const curvBundle = buildCurvilinearMapLibreLayers(curvModel, activeBinIndex);

    for (const src of curvBundle.sources) {
      try {
        const existingSource = this.map.getSource(src.id) as maplibregl.GeoJSONSource;
        if (existingSource) {
          existingSource.setData(src.data);
        } else {
          this.map.addSource(src.id, { type: src.type, data: src.data } as any);
        }
      } catch (e) {
        console.warn(`Error actualizando fuente curvilínea ${src.id}:`, e);
      }
    }
    for (const layer of curvBundle.layers) {
      try {
        if (!this.map.getLayer(layer.id)) {
          this.map.addLayer(layer as any);
        }
      } catch (e) {
        console.warn(`Error verificando capa curvilínea ${layer.id}:`, e);
      }
    }
  }

  private updateHighlightLayer(range: [number, number] | null, activeBinIndex: number | null = null): void {
    const state = this.store.getState();
    if (!state.alignment || !state.lrsResults) return;

    // Actualizar franja de resalte sobre la carretera
    const corridorConfig = buildMapLibreConfig(state.alignment, state.lrsResults, range);
    const highlightSrc = corridorConfig.sources.find((s) => s.id === 'source-highlight');

    if (highlightSrc) {
      const src = this.map.getSource('source-highlight') as maplibregl.GeoJSONSource;
      if (src) {
        src.setData(highlightSrc.data);
      }
    }

    const highlightLayer = this.map.getLayer('layer-highlight-strip');
    if (highlightLayer) {
      this.map.setPaintProperty(
        'layer-highlight-strip',
        'line-opacity',
        range ? 0.95 : 0.0
      );
    }

    // Actualizar estado isHovered en las barras curvilíneas
    const curvModel = generateCurvilinearProfile(state.alignment, state.lrsResults, {
      offsetDistanceMeters: state.config.curvilinearOffsetMeters,
      side: state.config.curvilinearSide,
      heightScaleMetersPerUnit: state.config.curvilinearHeightScale,
      metricMode: state.config.metricMode
    });
    const curvBundle = buildCurvilinearMapLibreLayers(curvModel, activeBinIndex);
    const barsSrcDef = curvBundle.sources.find((s) => s.id === 'source-curvilinear-bars');
    if (barsSrcDef) {
      const barsSrc = this.map.getSource('source-curvilinear-bars') as maplibregl.GeoJSONSource;
      if (barsSrc) {
        barsSrc.setData(barsSrcDef.data);
      }
    }
  }

  public fitToAlignment(): void {
    const state = this.store.getState();
    if (!state.alignment) return;

    this.map.resize();

    let minLng = state.alignment.bbox.minX;
    let minLat = state.alignment.bbox.minY;
    let maxLng = state.alignment.bbox.maxX;
    let maxLat = state.alignment.bbox.maxY;

    // Incluir límites geométricos del perfil curvilíneo para encuadre óptimo
    if (state.lrsResults) {
      const curvModel = generateCurvilinearProfile(state.alignment, state.lrsResults, {
        offsetDistanceMeters: state.config.curvilinearOffsetMeters,
        side: state.config.curvilinearSide,
        heightScaleMetersPerUnit: state.config.curvilinearHeightScale,
        metricMode: state.config.metricMode
      });

      for (const coord of curvModel.baselineCoordinates) {
        if (coord[0] < minLng) minLng = coord[0];
        if (coord[0] > maxLng) maxLng = coord[0];
        if (coord[1] < minLat) minLat = coord[1];
        if (coord[1] > maxLat) maxLat = coord[1];
      }

      for (const bar of curvModel.bars) {
        for (const coord of bar.polygonCoordinates) {
          if (coord[0] < minLng) minLng = coord[0];
          if (coord[0] > maxLng) maxLng = coord[0];
          if (coord[1] < minLat) minLat = coord[1];
          if (coord[1] > maxLat) maxLat = coord[1];
        }
      }
    }

    this.map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat]
      ],
      {
        padding: { top: 80, bottom: 80, left: 80, right: 300 }, // Margen derecho para no solapar con leyenda
        duration: 700,
        maxZoom: 15
      }
    );
  }

  private setupInteractions(): void {
    // 1. Hover sobre barras del perfil curvilíneo (VisQuill A1 Collision Density)
    this.map.on('mouseenter', 'layer-curvilinear-bars-fill', (e) => {
      this.map.getCanvas().style.cursor = 'pointer';

      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const props = feature.properties as any;
      const state = this.store.getState();
      const metricLabel = state.config.metricMode === 'EPDO' ? 'Índice EPDO (MTC)' : state.config.metricMode === 'DENSITY_KM' ? 'Densidad (/km)' : 'Total de Siniestros';

      const html = `
        <div style="font-family: inherit; font-size: 11px; line-height: 1.45; min-width: 175px;">
          <div style="font-weight: 700; color: #1e293b; margin-bottom: 3px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
            📊 Tramo: <code>${props.startStation}</code> - <code>${props.endStation}</code>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #7c3aed; margin-bottom: 4px;">
            ${metricLabel}: ${Number(props.value).toFixed(state.config.metricMode === 'EPDO' ? 1 : 0)}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px 8px; font-size: 10px; color: #475569;">
            <div><span style="color: #dc2626; font-weight: 700;">●</span> Fatal: <strong>${props.fatalCount}</strong></div>
            <div><span style="color: #ea580c; font-weight: 700;">●</span> Graves: <strong>${props.graveCount}</strong></div>
            <div><span style="color: #facc15; font-weight: 700;">●</span> Leves: <strong>${props.leveCount}</strong></div>
            <div><span style="color: #2563eb; font-weight: 700;">●</span> Daños: <strong>${props.danosCount}</strong></div>
          </div>
          <div style="margin-top: 5px; font-size: 9px; color: #94a3b8; font-style: italic;">
            Perfil curvilíneo paralelo (VisQuill GDK)
          </div>
        </div>
      `;

      this.popup.setLngLat(e.lngLat).setHTML(html).addTo(this.map);
      this.store.hoverBin(props.binIndex);
    });

    this.map.on('mouseleave', 'layer-curvilinear-bars-fill', () => {
      this.map.getCanvas().style.cursor = '';
      this.popup.remove();
      this.store.hoverBin(null);
    });

    this.map.on('click', 'layer-curvilinear-bars-fill', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const props = feature.properties as any;
      this.store.selectBin(props.binIndex);
    });

    // 2. Hover sobre siniestros individuales en el mapa (Puntos)
    this.map.on('mouseenter', 'layer-crashes-points', (e) => {
      this.map.getCanvas().style.cursor = 'pointer';

      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const props = feature.properties as any;
      const coords = (feature.geometry as any).coordinates.slice();

      const html = `
        <div style="font-family: inherit; font-size: 11px; line-height: 1.45; min-width: 160px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">
            📍 Siniestro: ${props.id}
          </div>
          <div><strong>Severidad:</strong> <span style="font-weight: 700; color: ${this.getSeverityColor(props.severity)}">${props.severity}</span></div>
          <div><strong>Tipología:</strong> ${props.type}</div>
          <div><strong>Progresiva MTC:</strong> <code>${props.station}</code></div>
          <div style="margin-top: 2px; font-size: 10px; color: ${props.isInsideBuffer ? '#10b981' : '#f59e0b'}; font-weight: 600;">
            ${props.isInsideBuffer ? '✓ En faja vial auditada' : '⚠ Fuera de buffer vial'}
          </div>
        </div>
      `;

      this.popup.setLngLat(coords).setHTML(html).addTo(this.map);
      this.store.hoverCrash(props.id);
    });

    this.map.on('mouseleave', 'layer-crashes-points', () => {
      this.map.getCanvas().style.cursor = '';
      this.popup.remove();
      this.store.hoverCrash(null);
    });

    this.map.on('click', 'layer-crashes-points', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const props = feature.properties as any;
      this.store.selectCrash(props.id);
    });
  }

  private getSeverityColor(sev: string): string {
    switch (sev) {
      case 'FATAL': return '#dc2626';
      case 'LESIONES_GRAVES': return '#ea580c';
      case 'LESIONES_LEVES': return '#facc15';
      case 'SOLO_DANOS': return '#2563eb';
      default: return '#64748b';
    }
  }
}
