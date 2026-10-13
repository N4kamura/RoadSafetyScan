import { describe, it, expect, beforeEach } from 'vitest';
import { RouteManager } from '../../../src/pkg/tracer/route-manager.js';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';

describe('SPEC-21: Route Locking and Editing', () => {
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

  it('las rutas nacen bloqueadas (isLocked = true) por defecto para evitar alteraciones accidentales', () => {
    const primary = manager.getPrimaryRoute();
    expect(primary).toBeDefined();
    expect(primary!.isLocked).toBe(true);

    const custom = manager.addRoute(
      createAlignment(
        [
          { longitude: -77.05, latitude: -12.05 },
          { longitude: -77.03, latitude: -12.07 }
        ],
        'ROUTE-LOCK-TEST',
        'Ruta Bloqueada'
      )
    );
    expect(custom.isLocked).toBe(true);
  });

  it('permite desbloquear y bloquear una ruta explícitamente', () => {
    manager.unlockRoute('EJEMPLO');
    expect(manager.getRoute('EJEMPLO')?.isLocked).toBe(false);

    manager.lockRoute('EJEMPLO');
    expect(manager.getRoute('EJEMPLO')?.isLocked).toBe(true);

    const toggled = manager.toggleLockRoute('EJEMPLO');
    expect(toggled).toBe(false);
    expect(manager.getRoute('EJEMPLO')?.isLocked).toBe(false);
  });

  it('permite actualizar la geometría de una ruta existente y la vuelve a bloquear al guardar', () => {
    const original = manager.getRoute('EJEMPLO')!;
    const originalLength = original.totalLengthMeters;

    const newCoords = [
      { longitude: -77.01, latitude: -12.01 },
      { longitude: -77.02, latitude: -12.02 },
      { longitude: -77.03, latitude: -12.03 }
    ];

    manager.unlockRoute('EJEMPLO');
    const updated = manager.updateRouteAlignment('EJEMPLO', newCoords);

    expect(updated).not.toBeNull();
    expect(updated!.alignment.vertices.length).toBe(3);
    expect(updated!.isLocked).toBe(true); // Se bloquea automáticamente
    expect(updated!.totalLengthMeters).not.toBe(originalLength);
  });
});
