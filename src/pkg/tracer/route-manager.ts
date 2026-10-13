/**
 * Gestor Centralizado de Rutas y Trazados Viales
 * Conforme a SPEC-15 y SPEC-21 (pkg/tracer)
 */

import { Alignment, GeoCoordinate } from './types.js';
import { createAlignment } from './alignment.js';
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
  isLocked?: boolean; // SPEC-21: Estado de protección contra edición accidental
}

export type RouteManagerListener = (routes: ManagedRoute[], primaryRoute: ManagedRoute | null) => void;

const STORAGE_KEY = 'roadSafety_custom_routes_v1';

export class RouteManager {
  private routes: Map<string, ManagedRoute> = new Map();
  private primaryRouteId: string | null = 'EJEMPLO';
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
      isCustom: false,
      isLocked: true // Bloqueado por defecto
    });
  }

  public getAllRoutes(): ManagedRoute[] {
    return Array.from(this.routes.values());
  }

  public getRoute(id: string): ManagedRoute | undefined {
    return this.routes.get(id);
  }

  public getVisibleRoutes(): ManagedRoute[] {
    return this.getAllRoutes().filter(r => r.visibleOnMap);
  }

  public getPrimaryRoute(): ManagedRoute | null {
    if (!this.primaryRouteId) return null;
    return this.routes.get(this.primaryRouteId) || null;
  }

  public setPrimaryRoute(id: string | null): void {
    if (id === null || id === 'NONE') {
      this.primaryRouteId = null;
      for (const r of this.routes.values()) {
        r.isPrimary = false;
      }
      this.notify();
      return;
    }

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

  public lockRoute(id: string): void {
    const route = this.routes.get(id);
    if (route) {
      route.isLocked = true;
      this.saveCustomRoutesToStorage();
      this.notify();
    }
  }

  public unlockRoute(id: string): void {
    const route = this.routes.get(id);
    if (route) {
      route.isLocked = false;
      this.saveCustomRoutesToStorage();
      this.notify();
    }
  }

  public toggleLockRoute(id: string): boolean {
    const route = this.routes.get(id);
    if (!route) return false;
    route.isLocked = route.isLocked === false ? true : false;
    this.saveCustomRoutesToStorage();
    this.notify();
    return route.isLocked;
  }

  public updateRouteAlignment(id: string, coords: GeoCoordinate[]): ManagedRoute | null {
    const route = this.routes.get(id);
    if (!route || coords.length < 2) return null;

    const updatedAlignment = createAlignment(
      coords,
      route.id,
      route.name,
      {
        shortName: route.shortName,
        description: route.description,
        color: route.color
      }
    );

    route.alignment = updatedAlignment;
    route.totalLengthMeters = updatedAlignment.totalLength;
    route.isLocked = true; // Se vuelve a bloquear automáticamente tras guardar cambios

    this.saveCustomRoutesToStorage();
    this.notify();
    return route;
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
      isCustom: true,
      isLocked: true // Bloqueado por defecto
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
          isLocked: r.isLocked !== false,
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
          isCustom: true,
          isLocked: item.isLocked !== undefined ? item.isLocked : true
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
