/**
 * Controlador de la Herramienta Interactiva de Trazo de Perfil sobre el Mapa
 * Conforme a SPEC-15 (ui & pkg/tracer)
 */

import * as maplibregl from 'maplibre-gl';
import { GeoCoordinate, Alignment } from '../pkg/tracer/types.js';
import { createAlignment } from '../pkg/tracer/alignment.js';
import { haversineDistance } from '../pkg/tracer/geodesy.js';
import { RouteManager } from '../pkg/tracer/route-manager.js';
import { generateTxtAlignmentTrace } from '../pkg/export/txt.js';
import { generateGtfsRoutesTxt, generateGtfsShapesTxt } from '../pkg/export/gtfs.js';
import { triggerBrowserDownload } from '../pkg/export/download.js';

export class TraceDrawerController {
  private map: maplibregl.Map;
  private routeManager: RouteManager;
  private isDrawing: boolean = false;
  private vertices: GeoCoordinate[] = [];
  private toolbarElement: HTMLElement | null = null;
  private clickHandler: ((e: maplibregl.MapMouseEvent) => void) | null = null;
  private mouseMoveHandler: ((e: maplibregl.MapMouseEvent) => void) | null = null;
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
    this.vertices = [];

    // Cambiar cursor a crosshair y deshabilitar zoom por doble clic
    this.map.getCanvas().style.cursor = 'crosshair';
    this.map.doubleClickZoom.disable();

    // Mostrar toolbar flotante
    if (this.toolbarElement) {
      this.toolbarElement.style.display = 'flex';
      this.updateStatsUI();
    }

    // Asegurar capas auxiliares de dibujo en el mapa
    this.ensureDrawingLayers();
    this.updateDrawingSource();

    // Registrar escuchador de clics
    this.clickHandler = (e: maplibregl.MapMouseEvent) => {
      this.addVertex({
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat
      });
    };
    this.map.on('click', this.clickHandler);
  }

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
    this.isDrawing = false;
    this.vertices = [];

    this.map.getCanvas().style.cursor = '';
    this.map.doubleClickZoom.enable();

    if (this.clickHandler) {
      this.map.off('click', this.clickHandler);
      this.clickHandler = null;
    }

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

    // Calcular longitud preliminar
    let totalLen = 0;
    for (let i = 1; i < this.vertices.length; i++) {
      totalLen += haversineDistance(this.vertices[i - 1], this.vertices[i]);
    }
    const lenKm = (totalLen / 1000).toFixed(2);

    // Prompt simple o modal para metadatos
    const defaultId = `TRAZO-${Date.now().toString().slice(-4)}`;
    const routeId = prompt('Código o Identificador de la nueva ruta (ej. CORREDOR-01):', defaultId)?.trim() || defaultId;
    const routeName = prompt('Nombre descriptivo del trazado:', `Nuevo Eje Vial (${lenKm} km)`)?.trim() || `Nuevo Eje Vial (${lenKm} km)`;

    // Paleta de colores predefinidos aleatorios o fijos
    const palette = ['#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#E11D48', '#10B981'];
    const selectedColor = palette[Math.floor(Math.random() * palette.length)];

    try {
      const alignment = createAlignment(
        this.vertices,
        routeId,
        routeName,
        {
          shortName: routeId,
          description: `Trazo interactivo creado el ${new Date().toLocaleDateString()}`,
          color: selectedColor
        }
      );

      // Registrar en el gestor de rutas
      this.routeManager.addRoute(alignment, true);

      // Generar y descargar archivo en formato .txt (Requerimiento usuario)
      const txtContent = generateTxtAlignmentTrace(alignment);
      triggerBrowserDownload(txtContent, `${routeId}.txt`, 'text/plain;charset=utf-8');

      // Notificar callback
      if (this.onTraceCreatedCallback) {
        this.onTraceCreatedCallback(alignment);
      }

      alert(`✓ ¡Trazo "${routeName}" creado exitosamente!\nSe ha guardado en el sistema y descargado en formato .txt (${routeId}.txt).`);
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
        <span class="pulse-recording" style="color: #ef4444; font-size: 1.1rem; animation: pulse 1.2s infinite;">●</span>
        <strong style="color: #0f172a; font-size: 0.82rem;">Modo Trazo de Perfil:</strong>
        <span style="color: #475569; font-size: 0.78rem;">Haz clic en el mapa para marcar vértices.</span>
        <span class="badge-draw-stats" style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; color: #1e293b; font-weight: 600;">
          Vértices: <b id="draw-vertex-count" style="color: #2563eb;">0</b> | Longitud: <b id="draw-length" style="color: #059669;">0.00 km</b>
        </span>
      </div>
      <div class="trace-draw-actions" style="display: flex; gap: 0.4rem;">
        <button id="btn-draw-undo" class="btn btn-sm btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" title="Deshacer último vértice">↶ Deshacer</button>
        <button id="btn-draw-cancel" class="btn btn-sm btn-outline" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" title="Cancelar dibujo">✕ Cancelar</button>
        <button id="btn-draw-finish" class="btn btn-sm btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem; background: #16a34a; color: #fff; font-weight: 600;" title="Finalizar y Guardar Trazo">✓ Guardar Trazo</button>
      </div>
    `;

    document.body.appendChild(toolbar);
    this.toolbarElement = toolbar;

    // Conectar botones
    document.getElementById('btn-draw-undo')?.addEventListener('click', () => this.undoLastVertex());
    document.getElementById('btn-draw-cancel')?.addEventListener('click', () => this.cancelDrawing());
    document.getElementById('btn-draw-finish')?.addEventListener('click', () => this.finishAndSave());
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
          'circle-radius': 6,
          'circle-color': '#F59E0B',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF'
        }
      });
    }
  }

  private updateDrawingSource(): void {
    const src = this.map.getSource('source-drawing-trace') as maplibregl.GeoJSONSource;
    if (!src) return;

    const features: any[] = [];

    // Vértices como puntos
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
