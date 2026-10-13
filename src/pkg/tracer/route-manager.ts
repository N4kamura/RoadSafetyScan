/**
 * Gestor Centralizado de Rutas y Trazados Viales
 * Conforme a SPEC-15 (pkg/tracer)
 */

import { Alignment } from './types.js';
import { createAlignment } from './alignment.js';
import { parseGtfsAlignments } from './importers/gtfs.js';
import { parseTxtAlignment } from './importers/txt.js';
import {
  MOCK_ALIGNMENT_DATA
} from '../../mock-data.js';

export interface ManagedRoute {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  color: string;
  totalLengthMeters: number;
  alignment: Alignment;
  visibleOnMap: boolean;
  isPrimary: boolean;
  isCustom?: boolean;
}

export type RouteManagerListener = (routes: ManagedRoute[], primaryRoute: ManagedRoute | null) => void;

const STORAGE_KEY = 'roadSafety_custom_routes_v1';

export class RouteManager {
  private routes: Map<string, ManagedRoute> = new Map();
  private primaryRouteId: string = 'EJEMPLO';
  private listeners: Set<RouteManagerListener> = new Set();

  constructor() {
    this.initDefaultRoutes();
    this.loadCustomRoutesFromStorage();
  }

  private initDefaultRoutes(): void {
    // Ruta de Ejemplo: Panamericana Sur (Km 18 al 25)
    const coords = MOCK_ALIGNMENT_DATA.coordinates.map((c: number[]) => ({
      longitude: c[0],
      latitude: c[1]
    }));
    const al = createAlignment(coords, 'EJEMPLO', 'Ruta de Ejemplo - Panamericana Sur (Km 18 al 25)', {
      shortName: 'EJEMPLO',
      description: 'Trazo de alineamiento vial de ejemplo (Km 18 al 25)',
      color: '#2563EB'
    });

    this.routes.set('EJEMPLO', {
      id: 'EJEMPLO',
      name: al.name,
      shortName: 'EJEMPLO',
      description: al.description,
      color: '#2563EB',
      totalLengthMeters: al.totalLength,
      alignment: al,
      visibleOnMap: true,
      isPrimary: true,
      isCustom: false
    });
  }

  public getAllRoutes(): ManagedRoute[] {
    return Array.from(this.routes.values());
  }

  public getVisibleRoutes(): ManagedRoute[] {
    return this.getAllRoutes().filter(r => r.visibleOnMap);
  }

  public getPrimaryRoute(): ManagedRoute | null {
    return this.routes.get(this.primaryRouteId) || this.getAllRoutes()[0] || null;
  }

  public setPrimaryRoute(id: string): void {
    if (!this.routes.has(id)) return;

    this.primaryRouteId = id;
    for (const [routeId, r] of this.routes) {
      r.isPrimary = (routeId === id);
      if (r.isPrimary) {
        r.visibleOnMap = true; // La ruta primaria siempre es visible en el mapa
      }
    }
    this.notify();
  }

  public toggleMapVisibility(id: string, visible?: boolean): void {
    const route = this.routes.get(id);
    if (!route) return;

    if (route.isPrimary && visible === false) {
      // La ruta primaria no se puede ocultar si está en análisis
      return;
    }

    route.visibleOnMap = visible !== undefined ? visible : !route.visibleOnMap;
    this.notify();
  }

  public addRoute(alignment: Alignment, setPrimary: boolean = true): ManagedRoute {
    const managed: ManagedRoute = {
      id: alignment.id,
      name: alignment.name,
      shortName: alignment.shortName || alignment.id,
      description: alignment.description,
      color: alignment.color || '#8B5CF6',
      totalLengthMeters: alignment.totalLength,
      alignment,
      visibleOnMap: true,
      isPrimary: setPrimary,
      isCustom: true
    };

    this.routes.set(alignment.id, managed);

    if (setPrimary) {
      this.primaryRouteId = alignment.id;
      for (const [routeId, r] of this.routes) {
        r.isPrimary = (routeId === alignment.id);
      }
    }

    this.saveCustomRoutesToStorage();
    this.notify();
    return managed;
  }

  public removeRoute(id: string): boolean {
    const route = this.routes.get(id);
    if (!route || !route.isCustom) return false;

    this.routes.delete(id);
    if (this.primaryRouteId === id) {
      this.primaryRouteId = 'EJEMPLO';
      const ej = this.routes.get('EJEMPLO');
      if (ej) ej.isPrimary = true;
    }

    this.saveCustomRoutesToStorage();
    this.notify();
    return true;
  }

  private saveCustomRoutesToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const customList = this.getAllRoutes()
        .filter(r => r.isCustom)
        .map(r => ({
          id: r.id,
          name: r.name,
          shortName: r.shortName,
          description: r.description,
          color: r.color,
          coordinates: r.alignment.vertices.map(v => [v.coordinates.longitude, v.coordinates.latitude])
        }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));
    } catch (e) {
      console.warn('No se pudo guardar ruta en localStorage:', e);
    }
  }

  private loadCustomRoutesFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return;

      for (const item of list) {
        if (!item.coordinates || item.coordinates.length < 2) continue;
        const coords = item.coordinates.map((c: number[]) => ({
          longitude: c[0],
          latitude: c[1]
        }));
        const alignment = createAlignment(coords, item.id, item.name, {
          shortName: item.shortName,
          description: item.description,
          color: item.color
        });
        this.routes.set(item.id, {
          id: item.id,
          name: item.name,
          shortName: item.shortName || item.id,
          description: item.description,
          color: item.color || '#8B5CF6',
          totalLengthMeters: alignment.totalLength,
          alignment,
          visibleOnMap: true,
          isPrimary: false,
          isCustom: true
        });
      }
    } catch (e) {
      console.warn('Error leyendo rutas guardadas de localStorage:', e);
    }
  }

  public subscribe(listener: RouteManagerListener): () => void {
    this.listeners.add(listener);
    listener(this.getAllRoutes(), this.getPrimaryRoute());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const all = this.getAllRoutes();
    const primary = this.getPrimaryRoute();
    for (const listener of this.listeners) {
      listener(all, primary);
    }
  }
}
