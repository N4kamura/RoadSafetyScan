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

  it('debe inicializar la ruta por defecto EJEMPLO', () => {
    const all = manager.getAllRoutes();
    expect(all.length).toBeGreaterThanOrEqual(1);

    const ej = all.find(r => r.id === 'EJEMPLO');
    expect(ej).toBeDefined();
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
});
