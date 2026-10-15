/**
 * Controlador de la Herramienta Interactiva de Trazo y Edición de Perfiles sobre el Mapa
 * Conforme a SPEC-15 y SPEC-21 (ui & pkg/tracer)
 */

import * as maplibregl from 'maplibre-gl';
import { GeoCoordinate, Alignment } from '../pkg/tracer/types.js';
import { createAlignment } from '../pkg/tracer/alignment.js';
import { haversineDistance } from '../pkg/tracer/geodesy.js';
import { RouteManager, ManagedRoute } from '../pkg/tracer/route-manager.js';
import { generateTxtAlignmentTrace } from '../pkg/export/txt.js';
import { triggerBrowserDownload } from '../pkg/export/download.js';

export class TraceDrawerController {
  private map: maplibregl.Map;
  private routeManager: RouteManager;
  private isDrawing: boolean = false;
  private editingRouteId: string | null = null;
  private editingRouteName: string = '';
  private activeDragIndex: number | null = null;
  private vertices: GeoCoordinate[] = [];
  private toolbarElement: HTMLElement | null = null;
  private clickHandler: ((e: maplibregl.MapMouseEvent) => void) | null = null;
  private onTraceCreatedCallback?: (alignment: Alignment) => void;

  constructor(
    map: maplibregl.Map,
    routeManager: RouteManager,
    onTraceCreated?: (alignment: Alignment) => void
  ) {
    this.map = map;
    this.routeManager = routeManager;
    this.onTraceCreatedCallback = onTraceCreated;
    this.createToolbarUI();
  }

  public getIsDrawing(): boolean {
    return this.isDrawing;
  }

  public startDrawing(): void {
    if (this.isDrawing) return;
    this.isDrawing = true;
    this.editingRouteId = null;
    this.editingRouteName = '';
    this.vertices = [];

    this.map.getCanvas().style.cursor = 'crosshair';
    this.map.doubleClickZoom.disable();

    if (this.toolbarElement) {
      this.toolbarElement.style.display = 'flex';
      this.resetToolbarUIText();
      this.updateStatsUI();
    }

    this.ensureDrawingLayers();
    this.updateDrawingSource();
    this.bindDrawingEvents();
  }

  public startEditingRoute(route: ManagedRoute): void {
    if (this.isDrawing) {
      this.cancelDrawing();
    }

    this.isDrawing = true;
    this.editingRouteId = route.id;
    this.editingRouteName = route.name;
    this.vertices = route.alignment.vertices.map(v => ({ ...v.coordinates }));

    this.map.getCanvas().style.cursor = 'crosshair';
    this.map.doubleClickZoom.disable();

    if (this.toolbarElement) {
      this.toolbarElement.style.display = 'flex';
      this.updateEditingToolbarUI(route.name);
      this.updateStatsUI();
    }

    this.ensureDrawingLayers();
    this.updateDrawingSource();
    this.bindDrawingEvents();
  }

  private bindDrawingEvents(): void {
    this.unbindDrawingEvents();

    // 1. Clic para añadir vértice al final (solo si no se está arrastrando)
    this.clickHandler = (e: maplibregl.MapMouseEvent) => {
      if (this.activeDragIndex !== null) return;
      this.addVertex({
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat
      });
    };
    this.map.on('click', this.clickHandler);

    // 2. Arrastre interactivo de vértices existentes
    this.map.on('mousedown', 'layer-drawing-trace-points', this.onPointMouseDown);
    this.map.on('mousemove', this.onMapMouseMove);
    this.map.on('mouseup', this.onMapMouseUp);

    this.map.on('mouseenter', 'layer-drawing-trace-points', this.onPointMouseEnter);
    this.map.on('mouseleave', 'layer-drawing-trace-points', this.onPointMouseLeave);
  }

  private unbindDrawingEvents(): void {
    if (this.clickHandler) {
      this.map.off('click', this.clickHandler);
      this.clickHandler = null;
    }
    this.map.off('mousedown', 'layer-drawing-trace-points', this.onPointMouseDown);
    this.map.off('mousemove', this.onMapMouseMove);
    this.map.off('mouseup', this.onMapMouseUp);

    this.map.off('mouseenter', 'layer-drawing-trace-points', this.onPointMouseEnter);
    this.map.off('mouseleave', 'layer-drawing-trace-points', this.onPointMouseLeave);
  }

  private onPointMouseDown = (e: any) => {
    if (!e.features || e.features.length === 0) return;
    const idx = e.features[0].properties?.index;
    if (idx !== undefined && idx >= 0 && idx < this.vertices.length) {
      this.activeDragIndex = idx;
      this.map.dragPan.disable();
      this.map.getCanvas().style.cursor = 'grabbing';
      e.preventDefault();
    }
  };

  private onMapMouseMove = (e: maplibregl.MapMouseEvent) => {
    if (this.activeDragIndex !== null) {
      this.vertices[this.activeDragIndex] = {
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat
      };
      this.updateDrawingSource();
      this.updateStatsUI();
    }
  };

  private onMapMouseUp = () => {
    if (this.activeDragIndex !== null) {
      this.activeDragIndex = null;
      this.map.dragPan.enable();
      this.map.getCanvas().style.cursor = 'crosshair';
    }
  };

  private onPointMouseEnter = () => {
    if (this.activeDragIndex === null) {
      this.map.getCanvas().style.cursor = 'grab';
    }
  };

  private onPointMouseLeave = () => {
    if (this.activeDragIndex === null) {
      this.map.getCanvas().style.cursor = 'crosshair';
    }
  };

  public addVertex(coord: GeoCoordinate): void {
    this.vertices.push(coord);
    this.updateDrawingSource();
    this.updateStatsUI();
  }

  public undoLastVertex(): void {
    if (this.vertices.length > 0) {
      this.vertices.pop();
      this.updateDrawingSource();
      this.updateStatsUI();
    }
  }

  public cancelDrawing(): void {
    if (this.editingRouteId) {
      this.routeManager.lockRoute(this.editingRouteId);
    }

    this.isDrawing = false;
    this.editingRouteId = null;
    this.editingRouteName = '';
    this.activeDragIndex = null;
    this.vertices = [];

    this.map.getCanvas().style.cursor = '';
    this.map.doubleClickZoom.enable();

    this.unbindDrawingEvents();

    if (this.toolbarElement) {
      this.toolbarElement.style.display = 'none';
    }

    this.clearDrawingSource();
  }

  public finishAndSave(): void {
    if (this.vertices.length < 2) {
      alert('Debes marcar al menos 2 vértices en el mapa para definir el trazo del perfil.');
      return;
    }

    // Modo 1: Edición de un trazo existente
    if (this.editingRouteId) {
      const updated = this.routeManager.updateRouteAlignment(this.editingRouteId, this.vertices);
      if (updated) {
        // Descargar archivo .txt actualizado
        const txtContent = generateTxtAlignmentTrace(updated.alignment);
        triggerBrowserDownload(txtContent, `${updated.id}.txt`, 'text/plain;charset=utf-8');

        if (this.onTraceCreatedCallback) {
          this.onTraceCreatedCallback(updated.alignment);
        }

        alert(`✓ ¡Trazo "${updated.name}" actualizado y bloqueado exitosamente!\nSe ha guardado y descargado en formato .txt (${updated.id}.txt).`);
      }
      this.cancelDrawing();
      return;
    }

    // Modo 2: Nuevo trazo
    let totalLen = 0;
    for (let i = 1; i < this.vertices.length; i++) {
      totalLen += haversineDistance(this.vertices[i - 1], this.vertices[i]);
    }
    const lenKm = (totalLen / 1000).toFixed(2);

    const routeName = prompt('Nombre del trazado:', `Nuevo Eje Vial (${lenKm} km)`)?.trim() || `Nuevo Eje Vial (${lenKm} km)`;
    const safeSlug = routeName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 16).replace(/^_+|_+$/g, '');
    const routeId = `RUTA_${safeSlug || 'TRAZO'}_${Date.now().toString().slice(-4)}`;

    const palette = ['#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#E11D48', '#10B981'];
    const selectedColor = palette[Math.floor(Math.random() * palette.length)];

    try {
      const alignment = createAlignment(
        this.vertices,
        routeId,
        routeName,
        {
          shortName: routeName,
          description: `Trazo interactivo creado el ${new Date().toLocaleDateString()}`,
          color: selectedColor
        }
      );

      this.routeManager.addRoute(alignment, true);

      const txtContent = generateTxtAlignmentTrace(alignment);
      triggerBrowserDownload(txtContent, `${routeName}.txt`, 'text/plain;charset=utf-8');

      if (this.onTraceCreatedCallback) {
        this.onTraceCreatedCallback(alignment);
      }

      alert(`✓ ¡Trazo "${routeName}" creado exitosamente!\nSe ha guardado en el sistema y descargado en formato .txt.`);
    } catch (err: any) {
      alert(`Error creando alineamiento: ${err.message}`);
    } finally {
      this.cancelDrawing();
    }
  }

  private createToolbarUI(): void {
    const existing = document.getElementById('trace-drawing-toolbar');
    if (existing) {
      this.toolbarElement = existing;
      return;
    }

    const toolbar = document.createElement('div');
    toolbar.id = 'trace-drawing-toolbar';
    toolbar.className = 'trace-drawing-toolbar';
    toolbar.style.display = 'none';

    toolbar.innerHTML = `
      <div class="trace-draw-info">
        <span id="trace-draw-icon" class="pulse-recording" style="color: #ef4444; font-size: 1.1rem; animation: pulse 1.2s infinite;">●</span>
        <strong id="trace-draw-title" style="color: #0f172a; font-size: 0.82rem;">Modo Trazo de Perfil:</strong>
        <span id="trace-draw-subtitle" style="color: #475569; font-size: 0.78rem;">Haz clic para marcar vértices o arrastra los existentes.</span>
        <span class="badge-draw-stats" style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; color: #1e293b; font-weight: 600;">
          Vértices: <b id="draw-vertex-count" style="color: #2563eb;">0</b> | Longitud: <b id="draw-length" style="color: #059669;">0.00 km</b>
        </span>
      </div>
      <div class="trace-draw-actions" style="display: flex; gap: 0.4rem;">
        <button id="btn-draw-undo" class="btn btn-sm btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" title="Deshacer último vértice">↶ Deshacer</button>
        <button id="btn-draw-cancel" class="btn btn-sm btn-outline" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" title="Cancelar dibujo o descartar edición">✕ Cancelar</button>
        <button id="btn-draw-finish" class="btn btn-sm btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem; background: #16a34a; color: #fff; font-weight: 600;" title="Finalizar y Guardar Trazo">✓ Guardar Trazo</button>
      </div>
    `;

    document.body.appendChild(toolbar);
    this.toolbarElement = toolbar;

    document.getElementById('btn-draw-undo')?.addEventListener('click', () => this.undoLastVertex());
    document.getElementById('btn-draw-cancel')?.addEventListener('click', () => this.cancelDrawing());
    document.getElementById('btn-draw-finish')?.addEventListener('click', () => this.finishAndSave());
  }

  private updateEditingToolbarUI(name: string): void {
    const iconEl = document.getElementById('trace-draw-icon');
    const titleEl = document.getElementById('trace-draw-title');
    const subEl = document.getElementById('trace-draw-subtitle');
    const finishBtn = document.getElementById('btn-draw-finish');
    if (iconEl) iconEl.textContent = '✏️';
    if (titleEl) titleEl.textContent = `Editando [${name}]:`;
    if (subEl) subEl.textContent = 'Arrastra vértices para reubicar o haz clic para añadir al final.';
    if (finishBtn) finishBtn.textContent = '✓ Guardar Cambios 🔒';
  }

  private resetToolbarUIText(): void {
    const iconEl = document.getElementById('trace-draw-icon');
    const titleEl = document.getElementById('trace-draw-title');
    const subEl = document.getElementById('trace-draw-subtitle');
    const finishBtn = document.getElementById('btn-draw-finish');
    if (iconEl) iconEl.textContent = '●';
    if (titleEl) titleEl.textContent = 'Modo Trazo de Perfil:';
    if (subEl) subEl.textContent = 'Haz clic en el mapa para marcar vértices.';
    if (finishBtn) finishBtn.textContent = '✓ Guardar Trazo';
  }

  private updateStatsUI(): void {
    const countEl = document.getElementById('draw-vertex-count');
    const lenEl = document.getElementById('draw-length');

    if (countEl) countEl.textContent = String(this.vertices.length);

    let totalDist = 0;
    for (let i = 1; i < this.vertices.length; i++) {
      totalDist += haversineDistance(this.vertices[i - 1], this.vertices[i]);
    }

    if (lenEl) lenEl.textContent = `${(totalDist / 1000).toFixed(2)} km`;
  }

  private ensureDrawingLayers(): void {
    if (!this.map.getSource('source-drawing-trace')) {
      this.map.addSource('source-drawing-trace', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
    }

    if (!this.map.getLayer('layer-drawing-trace-line')) {
      this.map.addLayer({
        id: 'layer-drawing-trace-line',
        type: 'line',
        source: 'source-drawing-trace',
        filter: ['==', '$type', 'LineString'],
        paint: {
          'line-color': '#F59E0B',
          'line-width': 4.5,
          'line-dasharray': [2, 1]
        }
      });
    }

    if (!this.map.getLayer('layer-drawing-trace-points')) {
      this.map.addLayer({
        id: 'layer-drawing-trace-points',
        type: 'circle',
        source: 'source-drawing-trace',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 7,
          'circle-color': '#F59E0B',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#FFFFFF'
        }
      });
    }
  }

  private updateDrawingSource(): void {
    const src = this.map.getSource('source-drawing-trace') as maplibregl.GeoJSONSource;
    if (!src) return;

    const features: any[] = [];

    // Vértices como puntos interactivos
    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      features.push({
        type: 'Feature',
        properties: { index: i },
        geometry: {
          type: 'Point',
          coordinates: [v.longitude, v.latitude]
        }
      });
    }

    // Línea que une los vértices
    if (this.vertices.length >= 2) {
      features.push({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: this.vertices.map(v => [v.longitude, v.latitude])
        }
      });
    }

    src.setData({
      type: 'FeatureCollection',
      features
    });
  }

  private clearDrawingSource(): void {
    const src = this.map.getSource('source-drawing-trace') as maplibregl.GeoJSONSource;
    if (src) {
      src.setData({ type: 'FeatureCollection', features: [] });
    }
  }
}
