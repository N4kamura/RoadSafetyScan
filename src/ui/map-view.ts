/**
 * Controlador del Mapa Cartográfico en MapLibre GL JS
 * Conforme a SPEC-04, SPEC-06 y SPEC-07 (pkg/viz & pkg/curvilinear)
 * Renderizado Resiliente del Eje, Puntos de Siniestros y Perfil Curvilíneo
 */

import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { VizStore } from '../pkg/viz/store.js';
import { buildMapLibreConfig } from '../pkg/viz/maplibre-adapter.js';
import { generateCurvilinearProfile, computeZoomScaleFactor } from '../pkg/curvilinear/generator.js';
import { buildCurvilinearMapLibreLayers } from '../pkg/curvilinear/maplibre-layers.js';
import {
  computePointerGeometry,
  projectPointToAlignmentChainage,
  computeScaleHandleCoordinate,
  convertDragToHeightScale
} from '../pkg/curvilinear/pointer.js';
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

  // SPEC-11: Puntero Semicircular y Línea Conectora
  private currentPointerChainage: number = 0;
  private isPointerLineVisible: boolean = false;
  private pointerMarker: maplibregl.Marker | null = null;
  private pointerElement: HTMLElement | null = null;

  // SPEC-12: Botón Rectangular Desplazable de Escala
  private scaleHandleMarker: maplibregl.Marker | null = null;
  private scaleHandleElement: HTMLElement | null = null;

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
      minZoom: 10.5, // SPEC-09: Límite máximo de alejamiento
      maxZoom: 18,
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

  private getEffectiveCurvilinearScale(): number {
    const baseScale = this.store.getState().config.curvilinearHeightScale;
    const currentZoom = this.map ? this.map.getZoom() : 13.0;
    const factor = computeZoomScaleFactor(currentZoom);
    return baseScale * factor;
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
      heightScaleMetersPerUnit: this.getEffectiveCurvilinearScale(),
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

    // 3. Capa de la Línea Conectora al Eje (SPEC-11)
    try {
      if (!this.map.getSource('source-curvilinear-pointer-line')) {
        this.map.addSource('source-curvilinear-pointer-line', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }
      if (!this.map.getLayer('layer-curvilinear-pointer-line')) {
        this.map.addLayer({
          id: 'layer-curvilinear-pointer-line',
          type: 'line',
          source: 'source-curvilinear-pointer-line',
          paint: {
            'line-color': '#0F172A',
            'line-width': 3.5,
            'line-opacity': 0.0
          }
        });
      }
    } catch (e) {
      console.warn('Error inicializando capa conectora pointer-line:', e);
    }

    if (this.currentPointerChainage === 0 && state.alignment) {
      this.currentPointerChainage = state.alignment.totalLength * 0.45;
    }
    this.initPointerMarker();
    this.updatePointerVisuals();
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

    // 2. Actualizar capas del perfil curvilíneo (SPEC-06 & SPEC-09 Auto-Escalado)
    const curvModel = generateCurvilinearProfile(state.alignment, state.lrsResults, {
      offsetDistanceMeters: state.config.curvilinearOffsetMeters,
      side: state.config.curvilinearSide,
      heightScaleMetersPerUnit: this.getEffectiveCurvilinearScale(),
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

    // 3. Actualizar puntero semicircular y línea conectora (SPEC-11)
    this.updatePointerVisuals();
  }

  private initPointerMarker(): void {
    if (this.pointerMarker && this.scaleHandleMarker) return;

    // 1. Botón Semicircular sobre la Baseline del Perfil (SPEC-11)
    if (!this.pointerMarker) {
      const el = document.createElement('div');
      el.className = 'curvilinear-pointer-btn';
      el.title = 'Haga clic para mostrar/ocultar línea al trazo o arrastre a lo largo de las barras (SPEC-11)';
      el.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 28 28" style="display: block; overflow: visible;">
          <path d="M 2 14 A 12 12 0 0 0 26 14 Z" fill="#0F172A" stroke="#FFFFFF" stroke-width="2" />
          <line x1="10" y1="18" x2="18" y2="18" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
          <line x1="10" y1="21" x2="18" y2="21" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      `;

      this.pointerElement = el;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isPointerLineVisible = !this.isPointerLineVisible;
        this.updatePointerVisuals();
      });

      this.pointerMarker = new maplibregl.Marker({
        element: el,
        draggable: true,
        rotationAlignment: 'map'
      });

      this.pointerMarker.on('drag', () => {
        const state = this.store.getState();
        if (!state.alignment) return;
        const lngLat = this.pointerMarker!.getLngLat();
        const s = projectPointToAlignmentChainage(state.alignment, [lngLat.lng, lngLat.lat]);
        this.currentPointerChainage = s;
        this.isPointerLineVisible = true;
        this.updatePointerVisuals();

        const binIdx = Math.floor(s / state.config.binSizeMeters);
        this.store.hoverBin(binIdx);
      });

      this.pointerMarker.addTo(this.map);
    }

    // 2. Botón Rectangular Desplazable de Escala sobre la Grilla (SPEC-12)
    if (!this.scaleHandleMarker) {
      const scaleEl = document.createElement('div');
      scaleEl.className = 'curvilinear-scale-handle-btn';
      scaleEl.title = 'Arrastre perpendicularmente a las barras para modificar la escala vertical (SPEC-12)';
      scaleEl.innerHTML = `
        <svg width="28" height="18" viewBox="0 0 28 18" style="display: block; overflow: visible;">
          <rect x="1" y="1" width="26" height="16" rx="3.5" fill="#0F172A" stroke="#FFFFFF" stroke-width="1.8" />
          <line x1="8" y1="4.5" x2="8" y2="13.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
          <line x1="13" y1="4.5" x2="13" y2="13.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
          <line x1="18" y1="4.5" x2="18" y2="13.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      `;

      this.scaleHandleElement = scaleEl;

      this.scaleHandleMarker = new maplibregl.Marker({
        element: scaleEl,
        draggable: true,
        rotationAlignment: 'map'
      });

      this.scaleHandleMarker.on('drag', () => {
        const state = this.store.getState();
        if (!state.alignment) return;

        const geom = computePointerGeometry(
          state.alignment,
          this.currentPointerChainage,
          state.config.curvilinearOffsetMeters,
          state.config.curvilinearSide
        );

        const markerLngLat = this.scaleHandleMarker!.getLngLat();
        const newScale = convertDragToHeightScale(
          geom.baselineCoord,
          [markerLngLat.lng, markerLngLat.lat],
          geom.normalVector,
          state.config.curvilinearSide
        );

        if (newScale !== state.config.curvilinearHeightScale) {
          this.store.updateConfig({ curvilinearHeightScale: newScale });
        }
      });

      this.scaleHandleMarker.on('dragend', () => {
        this.updatePointerVisuals();
      });

      this.scaleHandleMarker.addTo(this.map);
    }
  }

  public updatePointerVisuals(): void {
    const state = this.store.getState();
    if (!state.alignment || !this.pointerMarker) return;

    const geom = computePointerGeometry(
      state.alignment,
      this.currentPointerChainage,
      state.config.curvilinearOffsetMeters,
      state.config.curvilinearSide
    );

    // Mover marcador a la posición exacta sobre la baseline B(s)
    this.pointerMarker.setLngLat(geom.baselineCoord);

    // Rotar para orientar el domo semicircular hacia la carretera
    const rotation = geom.normalAngleDegrees + 90;
    this.pointerMarker.setRotation(rotation);

    // SPEC-12: Actualizar posición y rotación del botón rectangular de escala
    if (this.scaleHandleMarker) {
      const scaleGeom = computeScaleHandleCoordinate(
        state.alignment,
        this.currentPointerChainage,
        state.config.curvilinearOffsetMeters,
        this.getEffectiveCurvilinearScale(),
        state.config.curvilinearSide
      );
      this.scaleHandleMarker.setLngLat(scaleGeom.handleCoord);
      this.scaleHandleMarker.setRotation(scaleGeom.rotationDegrees);
    }

    // Actualizar fuente GeoJSON de la línea conectora
    const src = this.map.getSource('source-curvilinear-pointer-line') as maplibregl.GeoJSONSource;
    if (src) {
      src.setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: geom.connectorLineCoordinates
        },
        properties: {
          chainage: geom.chainageMeters,
          station: geom.stationFormatted
        }
      });
    }

    if (this.map.getLayer('layer-curvilinear-pointer-line')) {
      this.map.setPaintProperty(
        'layer-curvilinear-pointer-line',
        'line-opacity',
        this.isPointerLineVisible ? 1.0 : 0.0
      );
    }
  }

  /**
   * Actualiza únicamente las fuentes de datos del perfil curvilíneo (para zoom interactivo rápido)
   */
  public updateCurvilinearOnly(): void {
    const state = this.store.getState();
    if (!state.alignment || !state.lrsResults || !this.isLoaded) return;

    const activeBinIndex = state.selection.hoveredBinIndex ?? state.selection.selectedBinIndex;
    const curvModel = generateCurvilinearProfile(state.alignment, state.lrsResults, {
      offsetDistanceMeters: state.config.curvilinearOffsetMeters,
      side: state.config.curvilinearSide,
      heightScaleMetersPerUnit: this.getEffectiveCurvilinearScale(),
      metricMode: state.config.metricMode
    });
    const curvBundle = buildCurvilinearMapLibreLayers(curvModel, activeBinIndex);

    for (const src of curvBundle.sources) {
      try {
        const existingSource = this.map.getSource(src.id) as maplibregl.GeoJSONSource;
        if (existingSource) {
          existingSource.setData(src.data);
        }
      } catch (e) {
        // Silencioso si no está listo
      }
    }
    this.updatePointerVisuals();
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
      heightScaleMetersPerUnit: this.getEffectiveCurvilinearScale(),
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

    // 2. Hover sobre siniestros individuales en el mapa (Puntos - visibles en zoom >= 13.5 SPEC-08)
    this.map.on('mouseenter', 'layer-crashes-points', (e) => {
      if (this.map.getZoom() < 13.5) return;
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
      if (this.map.getZoom() < 13.5) return;
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const props = feature.properties as any;
      this.store.selectCrash(props.id);
    });

    // 3. Auto-escalado dinámico del perfil curvilíneo al alejar el zoom (SPEC-09)
    let lastZoom = this.map.getZoom();
    this.map.on('zoom', () => {
      const z = this.map.getZoom();
      if (Math.abs(z - lastZoom) >= 0.15) {
        lastZoom = z;
        this.updateCurvilinearOnly();
      }
    });

    this.map.on('zoomend', () => {
      lastZoom = this.map.getZoom();
      this.updateCurvilinearOnly();
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
