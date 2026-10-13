import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { VizStore } from '../../../src/pkg/viz/store.js';
import { buildVisQuillConfig } from '../../../src/pkg/viz/visquill-adapter.js';
import { buildMapLibreConfig } from '../../../src/pkg/viz/maplibre-adapter.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';
import { VISQUILL_ATTRIBUTION } from '../../../src/pkg/viz/types.js';

describe('Reactive Store & VisQuill Integration (pkg/viz) - SPEC-04 Compliance', () => {
  const alignment = createAlignment([
    { longitude: -77.0000, latitude: -12.0100 },
    { longitude: -77.0000, latitude: -12.0000 }
  ]);

  const sampleCrashes: CrashPoint[] = [
    {
      id: 'CRASH-01',
      coordinates: [-77.0000, -12.0080], // Progresiva ~222 m
      severity: SeverityLevel.FATAL,
      type: CrashType.CHOQUE
    },
    {
      id: 'CRASH-02',
      coordinates: [-77.0000, -12.0050], // Progresiva ~555 m
      severity: SeverityLevel.SOLO_DANOS,
      type: CrashType.DESPISTE
    }
  ];

  it('debe cumplir con Test Case 4.1: Sincronización Hover Profile -> Map', () => {
    const store = new VizStore(alignment, sampleCrashes);

    expect(store.getState().selection.hoveredBinIndex).toBeNull();
    expect(store.getState().selection.highlightedStationRange).toBeNull();

    // Simular que el usuario posa el cursor sobre el Bin 2 (progresiva 200m a 300m)
    store.hoverBin(2);

    const state = store.getState();
    expect(state.selection.hoveredBinIndex).toBe(2);
    expect(state.selection.highlightedStationRange).toEqual([200, 300]);

    // Verificar que el adaptador de MapLibre genera la geometría de resalte para ese rango
    const mapConfig = buildMapLibreConfig(alignment, state.lrsResults!, state.selection.highlightedStationRange);
    const highlightSource = mapConfig.sources.find((s) => s.id === 'source-highlight');
    expect(highlightSource).toBeDefined();
    expect(highlightSource?.data.geometry.coordinates.length).toBeGreaterThanOrEqual(2);
  });

  it('debe cumplir con Test Case 4.2: Filtro Dinámico de Severidad y Recálculo Reactivo', () => {
    const store = new VizStore(alignment, sampleCrashes);

    expect(store.getState().lrsResults?.projectedInsideBufferCount).toBe(2);

    // Filtrar únicamente siniestros FATALES (desactivar SOLO_DANOS)
    store.updateFilters({
      severities: [SeverityLevel.FATAL]
    });

    const state = store.getState();
    expect(state.filteredCrashes).toHaveLength(1);
    expect(state.lrsResults?.projectedInsideBufferCount).toBe(1);

    // Verificar en la configuración generada para VisQuill
    const vqConfig = buildVisQuillConfig(state.lrsResults!);
    const totalVisQuillPoints = vqConfig.data.reduce((sum, d) => sum + d.totalValue, 0);
    expect(totalVisQuillPoints).toBe(1);
  });

  it('debe incluir de forma obligatoria la atribución legal de VisQuill GDK en la configuración', () => {
    const store = new VizStore(alignment, sampleCrashes);
    const vqConfig = buildVisQuillConfig(store.getState().lrsResults!);

    expect(vqConfig.attribution).toBe(VISQUILL_ATTRIBUTION);
    expect(vqConfig.attribution).toContain('VisQuill GDK');
  });

  it('debe soportar interacción bidireccional desde Hover Crash en Mapa', () => {
    const store = new VizStore(alignment, sampleCrashes);

    // Poner hover sobre el siniestro 'CRASH-01' que está a ~222 m
    store.hoverCrash('CRASH-01');

    const state = store.getState();
    expect(state.selection.hoveredCrashId).toBe('CRASH-01');
    // Debe seleccionar automáticamente el bin 2 ([200, 300])
    expect(state.selection.hoveredBinIndex).toBe(2);
    expect(state.selection.highlightedStationRange).not.toBeNull();
  });
});
