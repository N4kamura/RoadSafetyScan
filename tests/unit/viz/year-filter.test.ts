import { describe, it, expect } from 'vitest';
import { VizStore } from '../../../src/pkg/viz/store.js';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('Filtro Temporal por Años (pkg/viz & ui/sidebar) - SPEC-13 Compliance', () => {
  const alignment = createAlignment([
    { longitude: -77.0000, latitude: -12.0100 },
    { longitude: -77.0000, latitude: -12.0000 }
  ]);

  const mockCrashes: CrashPoint[] = [
    {
      id: 'C-2021-1',
      coordinates: [-77.0001, -12.0080],
      year: 2021,
      timestamp: '2021-04-10T10:00:00Z',
      severity: SeverityLevel.FATAL,
      type: CrashType.CHOQUE
    },
    {
      id: 'C-2021-2',
      coordinates: [-77.0002, -12.0070],
      year: 2021,
      timestamp: '2021-08-15T15:00:00Z',
      severity: SeverityLevel.LESIONES_LEVES,
      type: CrashType.VOLCADURA
    },
    {
      id: 'C-2022-1',
      coordinates: [-77.0001, -12.0060],
      year: 2022,
      timestamp: '2022-01-20T08:00:00Z',
      severity: SeverityLevel.LESIONES_GRAVES,
      type: CrashType.ATROPELLO
    },
    {
      id: 'C-2023-1',
      coordinates: [-77.0001, -12.0050],
      year: 2023,
      timestamp: '2023-06-05T12:00:00Z',
      severity: SeverityLevel.FATAL,
      type: CrashType.CHOQUE
    },
    {
      id: 'C-2023-2',
      coordinates: [-77.0002, -12.0040],
      year: 2023,
      timestamp: '2023-11-12T22:30:00Z',
      severity: SeverityLevel.SOLO_DANOS,
      type: CrashType.DESPISTE
    },
    {
      id: 'C-2024-1',
      coordinates: [-77.0001, -12.0030],
      year: 2024,
      timestamp: '2024-02-14T14:00:00Z',
      severity: SeverityLevel.FATAL,
      type: CrashType.CHOQUE
    },
    {
      id: 'C-2024-2',
      coordinates: [-77.0001, -12.0020],
      // Sin propiedad year explícita, debe deducirse del timestamp
      timestamp: '2024-09-18T18:00:00Z',
      severity: SeverityLevel.LESIONES_LEVES,
      type: CrashType.VOLCADURA
    }
  ];

  it('debe cumplir con Test Case 13.1: Descubrimiento dinámico de años disponibles ordenados descendente', () => {
    const store = new VizStore(alignment, mockCrashes);
    const available = store.getAvailableYears();

    expect(available).toEqual([2024, 2023, 2022, 2021]);
  });

  it('debe cumplir con Test Case 13.2: Filtrado por un único año seleccionado', () => {
    const store = new VizStore(alignment, mockCrashes);

    store.setSelectedYears([2024]);
    const filtered = store.getState().filteredCrashes;

    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.id)).toEqual(['C-2024-1', 'C-2024-2']);

    // Verificar que el recálculo LRS refleja únicamente los siniestros de 2024
    const lrs = store.getState().lrsResults;
    expect(lrs).toBeDefined();
    expect(lrs!.totalInputCrashes).toBe(2);
  });

  it('debe cumplir con Test Case 13.3: Filtrado por múltiples años no contiguos', () => {
    const store = new VizStore(alignment, mockCrashes);

    store.setSelectedYears([2021, 2023]);
    const filtered = store.getState().filteredCrashes;

    expect(filtered).toHaveLength(4);
    expect(filtered.map((c) => c.id).sort()).toEqual(['C-2021-1', 'C-2021-2', 'C-2023-1', 'C-2023-2']);
  });

  it('debe cumplir con Test Case 13.4: Reversión al conjunto completo con undefined o lista completa', () => {
    const store = new VizStore(alignment, mockCrashes);

    store.setSelectedYears([2022]);
    expect(store.getState().filteredCrashes).toHaveLength(1);

    // Revertir a todos
    store.setSelectedYears(undefined);
    expect(store.getState().filteredCrashes).toHaveLength(7);

    // Revertir con lista completa explícita
    store.setSelectedYears([2021, 2022, 2023, 2024]);
    expect(store.getState().filteredCrashes).toHaveLength(7);
  });

  it('debe cumplir con Test Case 13.5: Lista vacía de años deselecciona todos los siniestros', () => {
    const store = new VizStore(alignment, mockCrashes);

    store.setSelectedYears([]);
    expect(store.getState().filteredCrashes).toHaveLength(0);

    const lrs = store.getState().lrsResults;
    expect(lrs).toBeDefined();
    expect(lrs!.totalInputCrashes).toBe(0);
  });

  it('debe cumplir con Test Case 13.6: Composición ortogonal con filtro de severidad y reloj horario', () => {
    const store = new VizStore(alignment, mockCrashes);

    // 1. Filtrar año 2021 (2 siniestros: C-2021-1 FATAL 10:00, C-2021-2 LEVES 15:00)
    store.setSelectedYears([2021]);
    expect(store.getState().filteredCrashes).toHaveLength(2);

    // 2. Componer con filtro de severidad solo FATAL
    store.updateFilters({ severities: [SeverityLevel.FATAL] });
    expect(store.getState().filteredCrashes).toHaveLength(1);
    expect(store.getState().filteredCrashes[0].id).toBe('C-2021-1');

    // 3. Componer con reloj horario que excluye las 10:00 (ej. 12:00 a 18:00)
    store.setTimeRange({ startMinute: 720, endMinute: 1080 }); // 12:00 a 18:00
    expect(store.getState().filteredCrashes).toHaveLength(0);

    // 4. Ampliar reloj horario para incluir las 10:00 (ej. 08:00 a 12:00 = 480 a 720)
    store.setTimeRange({ startMinute: 480, endMinute: 720 });
    expect(store.getState().filteredCrashes).toHaveLength(1);
    expect(store.getState().filteredCrashes[0].id).toBe('C-2021-1');
  });

  it('debe cumplir con Test Case 13.7: Emisión reactiva del evento FILTERS_UPDATED y recálculo de bins', () => {
    const store = new VizStore(alignment, mockCrashes);
    let eventReceived = false;

    store.subscribe((state, event) => {
      if (event.type === 'FILTERS_UPDATED') {
        eventReceived = true;
      }
    });

    store.setSelectedYears([2023]);
    expect(eventReceived).toBe(true);

    const lrs = store.getState().lrsResults;
    expect(lrs).toBeDefined();
    expect(lrs!.bins.reduce((sum, b) => sum + b.totalCount, 0)).toBe(lrs!.projectedInsideBufferCount);
  });
});
