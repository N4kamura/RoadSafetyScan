import { describe, it, expect, beforeEach } from 'vitest';
import { RouteManager } from '../../../src/pkg/tracer/route-manager.js';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';

describe('RouteManager (pkg/tracer) - SPEC-15 Compliance', () => {
  let manager: RouteManager;

  beforeEach(() => {
    const memoryStore: Record<string, string> = {};
    globalThis.localStorage = {
      getItem: (key: string) => memoryStore[key] ?? null,
      setItem: (key: string, val: string) => { memoryStore[key] = val; },
      removeItem: (key: string) => { delete memoryStore[key]; },
      clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); },
      length: 0,
      key: () => null
    } as any;

    manager = new RouteManager();
  });

  it('debe inicializar la ruta por defecto EJEMPLO con el trazado de Panamericana', () => {
    const all = manager.getAllRoutes();
    expect(all.length).toBeGreaterThanOrEqual(1);

    const ej = all.find(r => r.id === 'EJEMPLO');
    expect(ej).toBeDefined();
    expect(ej!.name).toBe('Panamericana');
    expect(ej!.isPrimary).toBe(true);
    expect(ej!.visibleOnMap).toBe(true);
  });

  it('debe permitir cambiar la ruta primaria a una ruta añadida', () => {
    const customAlignment = createAlignment(
      [
        { longitude: -77.05, latitude: -12.05 },
        { longitude: -77.03, latitude: -12.07 }
      ],
      'CUSTOM-01',
      'Ruta Alternativa'
    );
    manager.addRoute(customAlignment, false);

    manager.setPrimaryRoute('CUSTOM-01');
    const primary = manager.getPrimaryRoute();
    expect(primary).toBeDefined();
    expect(primary!.id).toBe('CUSTOM-01');
    expect(primary!.isPrimary).toBe(true);

    const ej = manager.getAllRoutes().find(r => r.id === 'EJEMPLO');
    expect(ej!.isPrimary).toBe(false);
  });

  it('debe permitir alternar la visibilidad de una ruta secundaria en el mapa', () => {
    const customAlignment = createAlignment(
      [
        { longitude: -77.05, latitude: -12.05 },
        { longitude: -77.03, latitude: -12.07 }
      ],
      'CUSTOM-VIS',
      'Ruta Visibilidad'
    );
    manager.addRoute(customAlignment, false);

    manager.toggleMapVisibility('CUSTOM-VIS', false);
    const route = manager.getAllRoutes().find(r => r.id === 'CUSTOM-VIS');
    expect(route!.visibleOnMap).toBe(false);

    manager.toggleMapVisibility('CUSTOM-VIS', true);
    expect(manager.getAllRoutes().find(r => r.id === 'CUSTOM-VIS')!.visibleOnMap).toBe(true);
  });

  it('debe agregar y remover una ruta personalizada', () => {
    const customAlignment = createAlignment(
      [
        { longitude: -77.05, latitude: -12.05 },
        { longitude: -77.03, latitude: -12.07 }
      ],
      'CUSTOM-TEST',
      'Trazo de Prueba'
    );

    const added = manager.addRoute(customAlignment, true);
    expect(added.id).toBe('CUSTOM-TEST');
    expect(added.isPrimary).toBe(true);
    expect(manager.getPrimaryRoute()!.id).toBe('CUSTOM-TEST');

    const removed = manager.removeRoute('CUSTOM-TEST');
    expect(removed).toBe(true);
    expect(manager.getAllRoutes().find(r => r.id === 'CUSTOM-TEST')).toBeUndefined();
    expect(manager.getPrimaryRoute()!.id).toBe('EJEMPLO');
  });

  it('debe notificar a los suscriptores cuando cambian las rutas', () => {
    let callCount = 0;
    const unsubscribe = manager.subscribe(() => {
      callCount++;
    });

    // 1er llamado ocurre inmediatamente al suscribirse
    expect(callCount).toBe(1);

    const customAlignment = createAlignment(
      [
        { longitude: -77.05, latitude: -12.05 },
        { longitude: -77.03, latitude: -12.07 }
      ],
      'CUSTOM-NOTIF',
      'Trazo Notificación'
    );
    manager.addRoute(customAlignment, true);
    expect(callCount).toBe(2);

    unsubscribe();
    manager.setPrimaryRoute('EJEMPLO');
    expect(callCount).toBe(2);
  });

  it('debe permitir deseleccionar la ruta primaria (SPEC-19 Navegación Libre)', () => {
    manager.setPrimaryRoute(null);
    expect(manager.getPrimaryRoute()).toBeNull();
    expect(manager.getAllRoutes().every(r => !r.isPrimary)).toBe(true);

    manager.setPrimaryRoute('NONE');
    expect(manager.getPrimaryRoute()).toBeNull();

    manager.setPrimaryRoute('EJEMPLO');
    expect(manager.getPrimaryRoute()?.id).toBe('EJEMPLO');
  });

  it('al analizar una ruta específica, solo dicha ruta debe quedar activa y visible en el mapa', () => {
    const routeA = createAlignment(
      [
        { longitude: -77.05, latitude: -12.05 },
        { longitude: -77.03, latitude: -12.07 }
      ],
      'RUTA-A',
      'Ruta A'
    );
    const routeB = createAlignment(
      [
        { longitude: -77.02, latitude: -12.08 },
        { longitude: -77.01, latitude: -12.09 }
      ],
      'RUTA-B',
      'Ruta B'
    );

    manager.addRoute(routeA, false);
    manager.addRoute(routeB, false);

    // Al seleccionar analizar RUTA-A
    manager.setPrimaryRoute('RUTA-A');

    const all = manager.getAllRoutes();
    const a = all.find(r => r.id === 'RUTA-A')!;
    const b = all.find(r => r.id === 'RUTA-B')!;
    const ej = all.find(r => r.id === 'EJEMPLO')!;

    expect(a.isPrimary).toBe(true);
    expect(a.visibleOnMap).toBe(true);

    expect(b.isPrimary).toBe(false);
    expect(b.visibleOnMap).toBe(false);

    expect(ej.isPrimary).toBe(false);
    expect(ej.visibleOnMap).toBe(false);

    // Al cambiar y analizar RUTA-B, RUTA-A no debe quedarse activa
    manager.setPrimaryRoute('RUTA-B');

    expect(b.isPrimary).toBe(true);
    expect(b.visibleOnMap).toBe(true);

    expect(a.isPrimary).toBe(false);
    expect(a.visibleOnMap).toBe(false);

    expect(ej.isPrimary).toBe(false);
    expect(ej.visibleOnMap).toBe(false);
  });

  it('al activar o hacer click en EJEMPLO cuando no está analizado, solo EJEMPLO queda activo y las demás se desactivan', () => {
    const customRoute = createAlignment(
      [
        { longitude: -77.05, latitude: -12.05 },
        { longitude: -77.03, latitude: -12.07 }
      ],
      'CUSTOM-ROUTE',
      'Ruta Personalizada'
    );
    manager.addRoute(customRoute, true);

    // En este punto, CUSTOM-ROUTE está analizada y EJEMPLO no
    expect(manager.getPrimaryRoute()?.id).toBe('CUSTOM-ROUTE');
    expect(manager.getRoute('EJEMPLO')?.isPrimary).toBe(false);
    expect(manager.getRoute('EJEMPLO')?.visibleOnMap).toBe(false);

    // El usuario hace clic / activa EJEMPLO
    manager.toggleMapVisibility('EJEMPLO', true);

    // Solo EJEMPLO debe quedar activa en el mapa y en análisis
    expect(manager.getPrimaryRoute()?.id).toBe('EJEMPLO');
    expect(manager.getRoute('EJEMPLO')?.isPrimary).toBe(true);
    expect(manager.getRoute('EJEMPLO')?.visibleOnMap).toBe(true);

    const custom = manager.getRoute('CUSTOM-ROUTE')!;
    expect(custom.isPrimary).toBe(false);
    expect(custom.visibleOnMap).toBe(false);
  });

  it('debe permitir eliminar la ruta por defecto si el usuario lo desea', () => {
    const removed = manager.removeRoute('EJEMPLO');
    expect(removed).toBe(true);
    expect(manager.getRoute('EJEMPLO')).toBeUndefined();
    expect(manager.getPrimaryRoute()).toBeNull();
  });
});
