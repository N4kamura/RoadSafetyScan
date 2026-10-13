/**
 * Controlador del Mapa Cartográfico en MapLibre GL JS
 * Conforme a SPEC-04, SPEC-06 y SPEC-07 (pkg/viz & pkg/curvilinear)
 * Renderizado Resiliente del Eje, Puntos de Siniestros y Perfil Curvilíneo
 */

import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { VizStore } from '../pkg/viz/store.js';
import { buildMapLibreConfig } from '../pkg/viz/maplibre-adapter.js';
import {
  generateCurvilinearProfile,
  computeZoomScaleFactor,
  computeVisibleStationRange,
  computeZoomAdaptiveBinSize
} from '../pkg/curvilinear/index.js';
import { buildCurvilinearMapLibreLayers } from '../pkg/curvilinear/maplibre-layers.js';
import {
  computePointerGeometry,
  projectPointToAlignmentChainage,
  computeScaleHandleCoordinate,
  convertDragToHeightScale,
  projectPointToBaselineArcLength
} from '../pkg/curvilinear/pointer.js';
import { VizStoreState, VizEvent } from '../pkg/viz/types.js';
import { RouteManager } from '../pkg/tracer/route-manager.js';
import { TraceDrawerController } from './trace-drawer.js';

// Configurar explícitamente el worker de MapLibre GL JS para Vite (ES Module Worker)
if (typeof (maplibregl as any).setWorkerUrl === 'function') {
  (maplibregl as any).setWorkerUrl(maplibreWorkerUrl);
}

export class MapViewController {
  private map: maplibregl.Map;
  private store: VizStore;
  private popup: maplibregl.Popup;
  private isLoaded: boolean = false;
  private routeManager?: RouteManager;
  private traceDrawer?: TraceDrawerController;

  // SPEC-11: Puntero Semicircular y Línea Conectora
  private currentPointerChainage: number = 0;
  private isPointerLineVisible: boolean = false;
  private pointerMarker: maplibregl.Marker | null = null;
  private pointerElement: HTMLElement | null = null;
  private isDraggingPointer: boolean = false;

  // SPEC-12: Botón Rectangular Desplazable de Escala
  private scaleHandleMarker: maplibregl.Marker | null = null;
  private scaleHandleElement: HTMLElement | null = null;
  private isDraggingScaleHandle: boolean = false;
  private cachedBaselineProfile: any = null;

  public getPointerMarker(): maplibregl.Marker | null {
    return this.pointerMarker;
  }

  public getScaleHandleMarker(): maplibregl.Marker | null {
    return this.scaleHandleMarker;
  }

  public getTraceDrawer(): TraceDrawerController | undefined {
    return this.traceDrawer;
  }

  constructor(containerId: string, store: VizStore, routeManager?: RouteManager) {
    this.store = store;
    this.routeManager = routeManager;
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

    const initAlign = this.store.getState().alignment;
    this.map = new maplibregl.Map({
      container: containerId,
      style: baseStyle,
      center: initAlign ? [-76.9450, -12.2100] : [-75.0, -9.19], // Coordenadas del corredor o centro de Perú
      zoom: initAlign ? 13 : 5.2,
      minZoom: initAlign ? 10.5 : 4.0, // SPEC-09 / SPEC-19: Límite de alejamiento dinámico según ruta activa
      maxZoom: 18,
      attributionControl: { compact: true }
    });

    (window as any).mapInstance = this.map;

    this.map.addControl(new maplibregl.NavigationControl(), 'top-left');

    // Inicializar herramienta de trazo interactivo y sincronización de rutas (SPEC-15 & SPEC-19)
    if (this.routeManager) {
      this.traceDrawer = new TraceDrawerController(this.map, this.routeManager, (newAlignment) => {
        this.store.setAlignment(newAlignment);
        this.fitToAlignment();
      });
      this.routeManager.subscribe((_routes, primary) => {
        const currentAlign = this.store.getState().alignment;
        if (primary && (!currentAlign || currentAlign.id !== primary.id)) {
          this.store.setAlignment(primary.alignment);
          this.fitToAlignment();
        } else if (!primary && currentAlign !== null) {
          this.store.setAlignment(null);
          this.fitToAlignment();
        }
        this.updateVisibleRoutesLayer();
      });
    }

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
        this.updateVisibleRoutesLayer();
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
        this.updateZoomLimits();
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

  /**
   * SPEC-23: Retorna el rango métrico [sMin, sMax] del eje vial visible en la pantalla actual
   */
  private getVisibleStationRange(): [number, number] | undefined {
    const state = this.store.getState();
    if (!state.alignment || !this.map) return undefined;
    try {
      const b = this.map.getBounds();
      const bounds = {
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth()
      };
      const vr = computeVisibleStationRange(state.alignment, bounds, state.config.binSizeMeters);
      return vr || [0, 0];
    } catch (e) {
      return undefined;
    }
  }

  private initLayers(): void {
    const state = this.store.getState();
    if (!state.alignment || !state.lrsResults) return;

    // 1. Capas base de alineamiento y corredor (incluyendo faja de buffer vial - SPEC-22)
    const corridorConfig = buildMapLibreConfig(state.alignment, state.lrsResults, null, {
      bufferWidthMeters: state.config.bufferWidthMeters
    });
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

    // 2. Capas del Perfil Curvilíneo Paralelo al Trazo (VisQuill A1 Collision Density & SPEC-23 Recorte Viewport)
    const curvModel = generateCurvilinearProfile(state.alignment, state.lrsResults, {
      offsetDistanceMeters: state.config.curvilinearOffsetMeters,
      side: state.config.curvilinearSide,
      heightScaleMetersPerUnit: this.getEffectiveCurvilinearScale(),
      metricMode: state.config.metricMode,
      visibleRange: this.getVisibleStationRange()
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

    // 4. Capas de Rutas Activas en el Mapa (SPEC-15)
    try {
      if (!this.map.getSource('source-visible-routes')) {
        this.map.addSource('source-visible-routes', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
      }
      if (!this.map.getLayer('layer-visible-routes-casing')) {
        this.map.addLayer({
          id: 'layer-visible-routes-casing',
          type: 'line',
          source: 'source-visible-routes',
          paint: {
            'line-color': '#0f172a',
            'line-width': 7.5,
            'line-opacity': 0.75
          }
        });
      }
      if (!this.map.getLayer('layer-visible-routes-line')) {
        this.map.addLayer({
          id: 'layer-visible-routes-line',
          type: 'line',
          source: 'source-visible-routes',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 4.5,
            'line-opacity': 0.95
          }
        });
      }
    } catch (e) {
      console.warn('Error inicializando capas de rutas visibles:', e);
    }

    if (this.currentPointerChainage === 0 && state.alignment) {
      this.currentPointerChainage = state.alignment.totalLength * 0.35;
    }
    this.initPointerMarker();
    this.updatePointerVisuals();
  }

  public updateVisibleRoutesLayer(): void {
    if (!this.map || !this.routeManager) return;
    const src = this.map.getSource('source-visible-routes') as maplibregl.GeoJSONSource;
    if (!src) return;

    const visibleRoutes = this.routeManager.getVisibleRoutes();
    const primary = this.routeManager.getPrimaryRoute();
    const features: any[] = [];

    for (const r of visibleRoutes) {
      features.push({
        type: 'Feature',
        properties: {
          id: r.id,
          name: r.name,
          shortName: r.shortName,
          color: r.color,
          isPrimary: r.id === primary?.id,
          lengthKm: (r.totalLengthMeters / 1000).toFixed(2)
        },
        geometry: {
          type: 'LineString',
          coordinates: r.alignment.vertices.map((v) => [v.coordinates.longitude, v.coordinates.latitude])
        }
      });
    }

    src.setData({
      type: 'FeatureCollection',
      features
    });
  }

  /**
   * SPEC-19: Actualiza dinámicamente los límites de zoom según la existencia de una ruta activa.
   * Con ruta activa: minZoom 10.5 (SPEC-09) para preservar escala geométrica del perfil.
   * Sin ruta activa: minZoom 4.0 (SPEC-19) para permitir exploración libre por todo el territorio de Perú.
   */
  public updateZoomLimits(): void {
    if (!this.map) return;
    const state = this.store.getState();
    if (state.alignment) {
      this.map.setMinZoom(10.5);
    } else {
      this.map.setMinZoom(4.0);
    }
  }

  /**
   * SPEC-19: Vacía de forma segura e idempotente las capas del corredor y perfil curvilíneo
   * cuando no hay una ruta seleccionada.
   */
  public clearAlignmentLayers(): void {
    if (!this.map) return;
    const emptyCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: []
    };

    const sourceIds = [
      'source-alignment',
      'source-buffer',
      'source-highlight',
      'source-curvilinear-bars',
      'source-curvilinear-isolines',
      'source-curvilinear-connectors',
      'source-curvilinear-labels'
    ];

    for (const id of sourceIds) {
      try {
        const src = this.map.getSource(id) as maplibregl.GeoJSONSource;
        if (src) {
          src.setData(emptyCollection);
        }
      } catch (e) {
        // Silencioso
      }
    }

    // Ocultar marcadores interactivos (puntero y escala)
    if (this.pointerMarker) {
      const el = this.pointerMarker.getElement();
      if (el) el.style.display = 'none';
    }
    if (this.scaleHandleMarker) {
      const el = this.scaleHandleMarker.getElement();
      if (el) el.style.display = 'none';
    }

    // Ocultar línea ortogonal conectora
    try {
      const pointerLineLayer = this.map.getLayer('layer-curvilinear-pointer-line');
      if (pointerLineLayer) {
        this.map.setPaintProperty('layer-curvilinear-pointer-line', 'line-opacity', 0.0);
      }
    } catch (e) {
      // Silencioso
    }
  }

  private updateView(): void {
    const state = this.store.getState();
    if (!state.alignment || !state.lrsResults) {
      this.clearAlignmentLayers();
      return;
    }

    const activeBinIndex = state.selection.hoveredBinIndex ?? state.selection.selectedBinIndex;

    // 1. Actualizar capas de alineamiento y corredor (incluyendo faja de buffer vial - SPEC-22)
    const corridorConfig = buildMapLibreConfig(
      state.alignment,
      state.lrsResults,
      state.selection.highlightedStationRange,
      { bufferWidthMeters: state.config.bufferWidthMeters }
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

    // 2. Actualizar capas del perfil curvilíneo (SPEC-06 & SPEC-23 Recorte Viewport)
    const curvModel = generateCurvilinearProfile(state.alignment, state.lrsResults, {
      offsetDistanceMeters: state.config.curvilinearOffsetMeters,
      side: state.config.curvilinearSide,
      heightScaleMetersPerUnit: this.getEffectiveCurvilinearScale(),
      metricMode: state.config.metricMode,
      visibleRange: this.getVisibleStationRange()
    });
    this.cachedBaselineProfile = curvModel.baselineProfile;
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
    const state = this.store.getState();
    if (!state.alignment) return;

    if (this.currentPointerChainage === 0) {
      this.currentPointerChainage = state.alignment.totalLength * 0.35;
    }

    const geom = computePointerGeometry(
      state.alignment,
      this.currentPointerChainage,
      state.config.curvilinearOffsetMeters,
      state.config.curvilinearSide,
      3,
      this.cachedBaselineProfile
    );

    const scaleGeom = computeScaleHandleCoordinate(
      state.alignment,
      this.currentPointerChainage,
      state.config.curvilinearOffsetMeters,
      this.getEffectiveCurvilinearScale(),
      state.config.curvilinearSide,
      3,
      this.cachedBaselineProfile
    );

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

      // Fijar posición y rotación ANTES de addTo para evitar errores en MapLibre
      this.pointerMarker.setLngLat(geom.baselineCoord);
      this.pointerMarker.setRotation(geom.pointerRotationDegrees);

      this.pointerMarker.on('dragstart', () => {
        this.isDraggingPointer = true;
      });

      this.pointerMarker.on('drag', () => {
        const currentState = this.store.getState();
        if (!currentState.alignment) return;
        const lngLat = this.pointerMarker!.getLngLat();

        let s: number;
        if (this.cachedBaselineProfile && this.cachedBaselineProfile.totalLength > 0) {
          // SPEC-26: Proyectar cursor sobre la línea base para constreñimiento 1D estricto
          const proj = projectPointToBaselineArcLength(this.cachedBaselineProfile, [lngLat.lng, lngLat.lat]);
          const tau = proj.arcLengthMeters / this.cachedBaselineProfile.totalLength;
          s = tau * currentState.alignment.totalLength;
        } else {
          s = projectPointToAlignmentChainage(currentState.alignment, [lngLat.lng, lngLat.lat]);
        }

        this.currentPointerChainage = Math.max(0, Math.min(currentState.alignment.totalLength, s));
        this.isPointerLineVisible = true;
        this.updatePointerVisuals();

        const binIdx = Math.floor(this.currentPointerChainage / currentState.config.binSizeMeters);
        this.store.hoverBin(binIdx);
      });

      this.pointerMarker.on('dragend', () => {
        this.isDraggingPointer = false;
        this.updatePointerVisuals();
      });

      this.pointerMarker.addTo(this.map);
    }

    // 2. Botón Rectangular Desplazable de Escala sobre la Grilla (SPEC-12)
    if (!this.scaleHandleMarker) {
      const scaleEl = document.createElement('div');
      scaleEl.className = 'curvilinear-scale-handle-btn';
      scaleEl.title = 'Escala de Altura (arrastre perpendicularmente para agrandar o achicar las barras)';
      scaleEl.innerHTML = `
        <svg width="34" height="20" viewBox="0 0 34 20" style="display: block; overflow: visible;">
          <rect x="1" y="1" width="32" height="18" rx="4" fill="#0F172A" stroke="#FFFFFF" stroke-width="2" />
          <line x1="9" y1="5" x2="9" y2="15" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
          <line x1="17" y1="5" x2="17" y2="15" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
          <line x1="25" y1="5" x2="25" y2="15" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <div class="scale-handle-badge">${state.config.curvilinearHeightScale} m/u</div>
      `;

      this.scaleHandleElement = scaleEl;

      this.scaleHandleMarker = new maplibregl.Marker({
        element: scaleEl,
        draggable: true,
        rotationAlignment: 'map'
      });

      // Fijar posición y rotación ANTES de addTo para evitar errores en MapLibre
      this.scaleHandleMarker.setLngLat(scaleGeom.handleCoord);
      this.scaleHandleMarker.setRotation(scaleGeom.rotationDegrees);

      this.scaleHandleMarker.on('dragstart', () => {
        this.isDraggingScaleHandle = true;
      });

      this.scaleHandleMarker.on('drag', () => {
        const currentState = this.store.getState();
        if (!currentState.alignment) return;

        const pGeom = computePointerGeometry(
          currentState.alignment,
          this.currentPointerChainage,
          currentState.config.curvilinearOffsetMeters,
          currentState.config.curvilinearSide
        );

        const markerLngLat = this.scaleHandleMarker!.getLngLat();
        const newScale = convertDragToHeightScale(
          pGeom.baselineCoord,
          [markerLngLat.lng, markerLngLat.lat],
          pGeom.normalVector,
          currentState.config.curvilinearSide
        );

        const badge = scaleEl.querySelector('.scale-handle-badge');
        if (badge) {
          badge.textContent = `${newScale} m/u`;
        }

        if (newScale !== currentState.config.curvilinearHeightScale) {
          this.store.updateConfig({ curvilinearHeightScale: newScale });
        }
      });

      this.scaleHandleMarker.on('dragend', () => {
        this.isDraggingScaleHandle = false;
        this.updatePointerVisuals();
      });

      this.scaleHandleMarker.addTo(this.map);
    }
  }

  public updatePointerVisuals(): void {
    const state = this.store.getState();
    if (!state.alignment) return;

    if (!this.pointerMarker || !this.scaleHandleMarker) {
      this.initPointerMarker();
    }

    if (this.pointerMarker) {
      const el = this.pointerMarker.getElement();
      if (el) el.style.display = 'flex';
    }
    if (this.scaleHandleMarker) {
      const el = this.scaleHandleMarker.getElement();
      if (el) el.style.display = 'flex';
    }

    if (!this.pointerMarker) return;

    const geom = computePointerGeometry(
      state.alignment,
      this.currentPointerChainage,
      state.config.curvilinearOffsetMeters,
      state.config.curvilinearSide,
      3,
      this.cachedBaselineProfile
    );

    // SPEC-26: El marcador siempre está pegado al trazo offset negro, incluso durante arrastre
    this.pointerMarker.setLngLat(geom.baselineCoord);
    this.pointerMarker.setRotation(geom.pointerRotationDegrees);

    // SPEC-12: Actualizar posición, rotación y badge del botón rectangular de escala
    if (this.scaleHandleMarker) {
      const scaleGeom = computeScaleHandleCoordinate(
        state.alignment,
        this.currentPointerChainage,
        state.config.curvilinearOffsetMeters,
        this.getEffectiveCurvilinearScale(),
        state.config.curvilinearSide,
        3,
        this.cachedBaselineProfile
      );
      if (!this.isDraggingScaleHandle) {
        this.scaleHandleMarker.setLngLat(scaleGeom.handleCoord);
        this.scaleHandleMarker.setRotation(scaleGeom.rotationDegrees);
      }

      const badge = this.scaleHandleElement?.querySelector('.scale-handle-badge');
      if (badge) {
        badge.textContent = `${state.config.curvilinearHeightScale} m/u`;
      }
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
      metricMode: state.config.metricMode,
      visibleRange: this.getVisibleStationRange()
    });
    this.cachedBaselineProfile = curvModel.baselineProfile;
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
      metricMode: state.config.metricMode,
      visibleRange: this.getVisibleStationRange()
    });
    this.cachedBaselineProfile = curvModel.baselineProfile;
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
    if (!state.alignment) {
      // SPEC-19: Si no hay ruta activa, encuadrar suavemente a la vista panorámica de todo el Perú
      this.map.easeTo({
        center: [-75.0, -9.19],
        zoom: 5.2,
        duration: 800
      });
      return;
    }

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

    // Incluir coordenadas de los marcadores interactivos (SPEC-11 y SPEC-12) para garantizar visibilidad
    if (this.pointerMarker) {
      const p = this.pointerMarker.getLngLat();
      if (p && typeof p.lng === 'number' && typeof p.lat === 'number') {
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
      }
    }
    if (this.scaleHandleMarker) {
      const h = this.scaleHandleMarker.getLngLat();
      if (h && typeof h.lng === 'number' && typeof h.lat === 'number') {
        if (h.lng < minLng) minLng = h.lng;
        if (h.lng > maxLng) maxLng = h.lng;
        if (h.lat < minLat) minLat = h.lat;
        if (h.lat > maxLat) maxLat = h.lat;
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
      let metricLabel = 'Total de Siniestros';
      if (state.config.metricMode === 'VEHICLES') metricLabel = 'Vehículos Involucrados';
      else if (state.config.metricMode === 'PERSONS') metricLabel = 'Personas Involucradas';
      else if (state.config.metricMode === 'EPDO') metricLabel = 'Índice EPDO (MTC)';
      else if (state.config.metricMode === 'DENSITY_KM') metricLabel = 'Densidad (/km)';

      const html = `
        <div style="font-family: inherit; font-size: 11px; line-height: 1.45; min-width: 190px;">
          <div style="font-weight: 700; color: #1e293b; margin-bottom: 3px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
            📊 Tramo: <code>${props.startStation}</code> - <code>${props.endStation}</code>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #7c3aed; margin-bottom: 4px;">
            ${metricLabel}: ${Number(props.value).toFixed(state.config.metricMode === 'EPDO' ? 1 : 0)}
          </div>
          <div style="background: #f8fafc; border-radius: 4px; padding: 3px 6px; margin-bottom: 4px; font-size: 10px;">
            <div style="color: #0284c7; font-weight: 600;">🚗 Vehículos: <strong>${props.totalVehicles ?? '--'}</strong></div>
            <div style="color: #6366f1; font-weight: 600;">👥 Personas: <strong>${props.totalPersons ?? '--'}</strong></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px 8px; font-size: 10px; color: #475569;">
            <div><span style="color: #dc2626; font-weight: 700;">●</span> Fallecidos: <strong>${props.fallecido ?? props.fatalCount}</strong></div>
            <div><span style="color: #ea580c; font-weight: 700;">●</span> Lesionados: <strong>${props.lesionado ?? (props.graveCount + props.leveCount)}</strong></div>
            <div><span style="color: #94a3b8; font-weight: 700;">●</span> No conoce: <strong>${props.noSeConoce ?? 0}</strong></div>
            <div><span style="color: #10b981; font-weight: 700;">●</span> Ilesos: <strong>${props.ileso ?? props.danosCount}</strong></div>
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
        <div style="font-family: inherit; font-size: 11px; line-height: 1.45; min-width: 185px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
            📍 Siniestro: ${props.id}
          </div>
          ${props.fecha ? `<div style="font-size: 10px; color: #64748b;">📅 ${props.fecha} ${props.hora ? `• ⏰ ${props.hora}` : ''}</div>` : ''}
          <div><strong>Severidad:</strong> <span style="font-weight: 700; color: ${this.getSeverityColor(props.severity)}">${props.severity}</span></div>
          <div><strong>Tipología:</strong> ${props.type}</div>
          <div><strong>Progresiva MTC:</strong> <code>${props.station}</code></div>
          <div style="background: #f1f5f9; border-radius: 4px; padding: 3px 6px; margin: 4px 0; font-size: 10px;">
            <div style="color: #0284c7; font-weight: 600;">🚗 Vehículos involucrados: <strong>${props.vehiclesCount ?? 1}</strong></div>
            <div style="color: #6366f1; font-weight: 600;">👥 Personas involucradas: <strong>${props.personsCount ?? 1}</strong></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1px 4px; margin-top: 2px; font-size: 9.5px;">
              <span style="color: #dc2626;">• Fallecidos: <strong>${props.fallecido ?? 0}</strong></span>
              <span style="color: #ea580c;">• Lesionados: <strong>${props.lesionado ?? 0}</strong></span>
              <span style="color: #64748b;">• No conoce: <strong>${props.noSeConoce ?? 0}</strong></span>
              <span style="color: #16a34a;">• Ilesos: <strong>${props.ileso ?? 0}</strong></span>
            </div>
          </div>
          ${props.distrito || props.provincia ? `<div style="font-size: 10px; color: #64748b;">📍 ${[props.distrito, props.provincia, props.departamento].filter(Boolean).join(', ')}</div>` : ''}
          <div style="margin-top: 3px; font-size: 10px; color: ${props.isInsideBuffer ? '#10b981' : '#f59e0b'}; font-weight: 600;">
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

    // 3. Recorte al viewport con segmentación métrica fija a 100m (SPEC-23 & SPEC-25)
    let animFrameId: number | null = null;
    const handleMapMovement = () => {
      if (animFrameId !== null) return;
      animFrameId = requestAnimationFrame(() => {
        animFrameId = null;
        if (!this.map || !this.isLoaded) return;
        this.updateCurvilinearOnly();
      });
    };

    this.map.on('move', handleMapMovement);
    this.map.on('zoom', handleMapMovement);
    this.map.on('moveend', () => {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      if (!this.map || !this.isLoaded) return;
      this.updateCurvilinearOnly();
    });

    // SPEC-26: Interacción al hacer clic en el trazo offset negro para mover el puntero
    this.map.on('click', 'layer-curvilinear-baseline-line', (e) => {
      const currentState = this.store.getState();
      if (!currentState.alignment || !this.cachedBaselineProfile) return;
      const proj = projectPointToBaselineArcLength(this.cachedBaselineProfile, [e.lngLat.lng, e.lngLat.lat]);
      const tau = proj.arcLengthMeters / (this.cachedBaselineProfile.totalLength || 1);
      this.currentPointerChainage = Math.max(0, Math.min(currentState.alignment.totalLength, tau * currentState.alignment.totalLength));
      this.isPointerLineVisible = true;
      this.updatePointerVisuals();
    });

    this.map.on('mouseenter', 'layer-curvilinear-baseline-line', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', 'layer-curvilinear-baseline-line', () => {
      this.map.getCanvas().style.cursor = '';
    });

    // 4. Interacción con Rutas Activas en el Mapa (SPEC-15)
    this.map.on('click', 'layer-visible-routes-line', (e) => {
      if (this.traceDrawer?.getIsDrawing()) return;
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const routeId = feat.properties?.id;
      if (routeId && this.routeManager) {
        this.routeManager.setPrimaryRoute(routeId);
      }
    });

    this.map.on('mouseenter', 'layer-visible-routes-line', (e) => {
      if (this.traceDrawer?.getIsDrawing()) return;
      this.map.getCanvas().style.cursor = 'pointer';
      if (!e.features || e.features.length === 0) return;
      const p = e.features[0].properties as any;
      if (!p) return;
      this.popup
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family: inherit; font-size: 11px; padding: 4px; line-height: 1.4;">
            <div style="font-weight: 700; color: ${p.color || '#2563eb'};">🛣️ ${p.shortName || p.id}: ${p.name}</div>
            <div style="color: #64748b; font-size: 10px;">Longitud: ${p.lengthKm} km</div>
            <div style="font-size: 9.5px; color: #10b981; font-weight: 600; margin-top: 2px;">
              ${p.isPrimary ? '● Eje primario en análisis LRS' : '🎯 Clic para analizar este trazo'}
            </div>
          </div>
        `)
        .addTo(this.map);
    });

    this.map.on('mouseleave', 'layer-visible-routes-line', () => {
      if (this.traceDrawer?.getIsDrawing()) return;
      this.map.getCanvas().style.cursor = '';
      this.popup.remove();
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
