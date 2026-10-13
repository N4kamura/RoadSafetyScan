import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('SPEC-14: Agregación LRS con Vehículos y Desglose de Personas por Gravedad', () => {
  // Crear un eje simple de 1 km (10 bins de 100m)
  const alignment = createAlignment([
    { longitude: -77.0, latitude: -12.0 },
    { longitude: -77.0, latitude: -12.009 }
  ], 'TEST-AXIS', 'Eje de Prueba SPEC-14');

  it('debe acumular correctamente cantidad de vehículos y personas desglosadas por gravedad', () => {
    const crashes: CrashPoint[] = [
      {
        id: 'CRASH-01',
        coordinates: [-77.0, -12.001], // en el primer o segundo bin
        severity: SeverityLevel.FATAL,
        type: CrashType.CHOQUE,
        vehiclesCount: 2,
        personsCount: 4,
        personsBreakdown: {
          fallecido: 1,
          lesionado: 2,
          noSeConoce: 0,
          ileso: 1
        }
      },
      {
        id: 'CRASH-02',
        coordinates: [-77.0, -12.001], // mismo tramo
        severity: SeverityLevel.LESIONES_GRAVES,
        type: CrashType.DESPISTE,
        vehiclesCount: 1,
        personsCount: 3,
        personsBreakdown: {
          fallecido: 0,
          lesionado: 1,
          noSeConoce: 1,
          ileso: 1
        }
      }
    ];

    const result = analyzeLrs(alignment, crashes, { bufferWidthMeters: 50, binSizeMeters: 200 });

    expect(result.projectedInsideBufferCount).toBe(2);

    const targetBin = result.bins.find((b) => b.crashes.length === 2);
    expect(targetBin).toBeDefined();

    if (targetBin) {
      expect(targetBin.totalCount).toBe(2);
      expect(targetBin.totalVehicles).toBe(3); // 2 + 1
      expect(targetBin.totalPersons).toBe(7);  // 4 + 3
      expect(targetBin.personsBreakdown.fallecido).toBe(1);
      expect(targetBin.personsBreakdown.lesionado).toBe(3); // 2 + 1
      expect(targetBin.personsBreakdown.noSeConoce).toBe(1);
      expect(targetBin.personsBreakdown.ileso).toBe(2); // 1 + 1
    }
  });

  it('debe emplear fallback seguro cuando el siniestro no cuenta con desglose explícito de personas', () => {
    const legacyCrash: CrashPoint[] = [
      {
        id: 'LEGACY-01',
        coordinates: [-77.0, -12.002],
        severity: SeverityLevel.FATAL,
        type: CrashType.ATROPELLO,
        vehicles: ['AUTO']
      }
    ];

    const result = analyzeLrs(alignment, legacyCrash, { bufferWidthMeters: 50, binSizeMeters: 200 });
    const targetBin = result.bins.find((b) => b.crashes.length === 1);

    expect(targetBin).toBeDefined();
    if (targetBin) {
      expect(targetBin.totalVehicles).toBe(1);
      expect(targetBin.totalPersons).toBe(1);
      expect(targetBin.personsBreakdown.fallecido).toBe(1);
      expect(targetBin.personsBreakdown.lesionado).toBe(0);
      expect(targetBin.personsBreakdown.ileso).toBe(0);
    }
  });
});
