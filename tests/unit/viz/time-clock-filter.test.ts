import { describe, it, expect } from 'vitest';
import { formatMinutes } from '../../../src/ui/time-clock.js';
import { VizStore } from '../../../src/pkg/viz/store.js';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('Circular Time Clock Filter (pkg/viz & ui/time-clock) - SPEC-10 Compliance', () => {
  it('debe cumplir con Test Case 10.1: Formateo exacto de minutos en formato 24h HH:MM', () => {
    expect(formatMinutes(0)).toBe('00:00');
    expect(formatMinutes(60)).toBe('01:00');
    expect(formatMinutes(480)).toBe('08:00');
    expect(formatMinutes(1080)).toBe('18:00');
    expect(formatMinutes(1401)).toBe('23:21');
    expect(formatMinutes(1440)).toBe('00:00');
    expect(formatMinutes(-60)).toBe('23:00');
  });

  it('debe cumplir con Test Case 10.2: Filtrado dentro del mismo día (startMinute <= endMinute)', () => {
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0090 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    const crashes: CrashPoint[] = [
      {
        id: 'C-MORNING',
        coordinates: [-77.0000, -12.0080],
        timestamp: '2024-05-10T08:30:00Z', // 08:30 = 510 min
        severity: SeverityLevel.FATAL,
        type: CrashType.CHOQUE
      },
      {
        id: 'C-NOON',
        coordinates: [-77.0000, -12.0050],
        timestamp: '2024-05-10T12:00:00Z', // 12:00 = 720 min
        severity: SeverityLevel.LESIONES_GRAVES,
        type: CrashType.CHOQUE
      },
      {
        id: 'C-NIGHT',
        coordinates: [-77.0000, -12.0020],
        timestamp: '2024-05-10T22:15:00Z', // 22:15 = 1335 min
        severity: SeverityLevel.SOLO_DANOS,
        type: CrashType.CHOQUE
      }
    ];

    const store = new VizStore(alignment, crashes);
    expect(store.getState().filteredCrashes).toHaveLength(3);

    // Filtrar ventana de 08:00 (480 min) a 14:00 (840 min)
    store.setTimeRange({ startMinute: 480, endMinute: 840 });

    const filtered = store.getState().filteredCrashes;
    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.id)).toEqual(['C-MORNING', 'C-NOON']);
  });

  it('debe cumplir con Test Case 10.3: Filtrado en ventana que cruza la medianoche (startMinute > endMinute)', () => {
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0090 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    const crashes: CrashPoint[] = [
      {
        id: 'C-LATE-NIGHT',
        coordinates: [-77.0000, -12.0080],
        timestamp: '2024-05-10T23:30:00Z', // 23:30 = 1410 min
        severity: SeverityLevel.FATAL,
        type: CrashType.CHOQUE
      },
      {
        id: 'C-EARLY-MORNING',
        coordinates: [-77.0000, -12.0050],
        timestamp: '2024-05-10T02:15:00Z', // 02:15 = 135 min
        severity: SeverityLevel.LESIONES_GRAVES,
        type: CrashType.CHOQUE
      },
      {
        id: 'C-AFTERNOON',
        coordinates: [-77.0000, -12.0020],
        timestamp: '2024-05-10T15:00:00Z', // 15:00 = 900 min
        severity: SeverityLevel.SOLO_DANOS,
        type: CrashType.CHOQUE
      }
    ];

    const store = new VizStore(alignment, crashes);

    // Ventana nocturna que cruza medianoche: 22:00 (1320 min) a 05:00 (300 min)
    store.setTimeRange({ startMinute: 1320, endMinute: 300 });

    const filtered = store.getState().filteredCrashes;
    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.id)).toEqual(['C-LATE-NIGHT', 'C-EARLY-MORNING']);

    // Restablecer a día completo (null)
    store.setTimeRange(null);
    expect(store.getState().filteredCrashes).toHaveLength(3);
  });
});
