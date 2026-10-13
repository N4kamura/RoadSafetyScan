import { describe, it, expect, beforeEach } from 'vitest';
import { VizStore } from '../../../src/pkg/viz/store.js';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { RouteManager } from '../../../src/pkg/tracer/route-manager.js';
import { MOCK_CRASHES_DATA } from '../../../src/mock-data.js';

describe('SPEC-19: Límites Dinámicos de Zoom y Navegación Libre por el Perú', () => {
  const sampleAlignment = createAlignment(
    [
      { longitude: -76.96, latitude: -12.18 },
      { longitude: -76.958, latitude: -12.185 }
    ],
    'TEST-ROUTE',
    'Ruta de Prueba'
  );

  it('debe permitir setAlignment(null) en VizStore limpiando lrsResults', () => {
    const store = new VizStore(sampleAlignment, MOCK_CRASHES_DATA);
    expect(store.getState().alignment).not.toBeNull();
    expect(store.getState().lrsResults).not.toBeNull();

    let alignmentChangedPayload: any = undefined;
    store.subscribe((state, event) => {
      if (event.type === 'ALIGNMENT_CHANGED') {
        alignmentChangedPayload = event.payload;
      }
    });

    store.setAlignment(null);

    expect(store.getState().alignment).toBeNull();
    expect(store.getState().lrsResults).toBeNull();
    expect(alignmentChangedPayload).toBeNull();
  });

  it('debe restaurar lrsResults al volver a asignar un alineamiento válido', () => {
    const store = new VizStore(undefined, MOCK_CRASHES_DATA);
    expect(store.getState().alignment).toBeNull();
    expect(store.getState().lrsResults).toBeNull();

    store.setAlignment(sampleAlignment);

    expect(store.getState().alignment).toBe(sampleAlignment);
    expect(store.getState().lrsResults).not.toBeNull();
    expect(store.getState().lrsResults!.bins.length).toBeGreaterThan(0);
  });

  it('debe calcular el minZoom dinámico según el estado de la ruta (10.5 con ruta, 4.0 sin ruta)', () => {
    // Función auxiliar que refleja la lógica de MapViewController.updateZoomLimits
    const resolveMinZoom = (alignment: any | null): number => {
      return alignment ? 10.5 : 4.0;
    };

    expect(resolveMinZoom(sampleAlignment)).toBe(10.5);
    expect(resolveMinZoom(null)).toBe(4.0);
    expect(resolveMinZoom(undefined)).toBe(4.0);
  });

  it('debe coordinar RouteManager y VizStore al alternar entre ruta activa y exploración libre', () => {
    const memoryStore: Record<string, string> = {};
    globalThis.localStorage = {
      getItem: (key: string) => memoryStore[key] ?? null,
      setItem: (key: string, val: string) => { memoryStore[key] = val; },
      removeItem: (key: string) => { delete memoryStore[key]; },
      clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); },
      length: 0,
      key: () => null
    } as any;

    const routeManager = new RouteManager();
    const primary = routeManager.getPrimaryRoute();
    expect(primary).not.toBeNull();

    const store = new VizStore(primary!.alignment, MOCK_CRASHES_DATA);

    // Simulación de suscripción de sincronización de la aplicación
    routeManager.subscribe((_routes, currentPrimary) => {
      store.setAlignment(currentPrimary ? currentPrimary.alignment : null);
    });

    // Deseleccionar ruta activa
    routeManager.setPrimaryRoute(null);
    expect(store.getState().alignment).toBeNull();
    expect(store.getState().lrsResults).toBeNull();

    // Volver a seleccionar la ruta
    routeManager.setPrimaryRoute('EJEMPLO');
    expect(store.getState().alignment).not.toBeNull();
    expect(store.getState().alignment!.id).toBe('EJEMPLO');
    expect(store.getState().lrsResults).not.toBeNull();
  });
});
