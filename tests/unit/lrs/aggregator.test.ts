import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { calculateEpdoScore, analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('LRS Aggregator & EPDO Engine (pkg/lrs) - SPEC-03 Compliance', () => {
  describe('calculateEpdoScore', () => {
    it('debe cumplir con Test Case 3.4 de SPEC-03 (Ponderación MTC)', () => {
      // 1 fatal, 2 graves, 0 leves, 3 solo daños
      const counts: Record<SeverityLevel, number> = {
        [SeverityLevel.FATAL]: 1,
        [SeverityLevel.LESIONES_GRAVES]: 2,
        [SeverityLevel.LESIONES_LEVES]: 0,
        [SeverityLevel.SOLO_DANOS]: 3
      };

      // EPDO = 1*9.5 + 2*3.5 + 0*1.0 + 3*1.0 = 9.5 + 7.0 + 3.0 = 19.5
      const score = calculateEpdoScore(counts);
      expect(score).toBe(19.5);
    });

    it('debe permitir sobreescribir pesos EPDO personalizados', () => {
      const counts: Record<SeverityLevel, number> = {
        [SeverityLevel.FATAL]: 1,
        [SeverityLevel.LESIONES_GRAVES]: 1,
        [SeverityLevel.LESIONES_LEVES]: 1,
        [SeverityLevel.SOLO_DANOS]: 1
      };

      const customWeights = {
        fatal: 12.0,
        grave: 5.0,
        leve: 2.0,
        soloDanos: 1.0
      };

      const score = calculateEpdoScore(counts, customWeights);
      expect(score).toBe(20.0);
    });
  });

  describe('analyzeLrs', () => {
    it('debe generar la cantidad exacta de bins métricos homogéneos', () => {
      // Eje de ~1,000 m
      const alignment = createAlignment([
        { longitude: -77.0000, latitude: -12.0090 },
        { longitude: -77.0000, latitude: -12.0000 }
      ]);

      const result = analyzeLrs(alignment, [], { binSizeMeters: 100 });

      // Si mide ~1,000 m, debe generar 10 o 11 bins de 100 m
      expect(result.bins.length).toBeGreaterThanOrEqual(10);
      expect(result.bins[0].startChainageMeters).toBe(0);
      expect(result.bins[0].endChainageMeters).toBe(100);
      expect(result.bins[0].startStationFormatted).toBe('km 0+000.00');
      expect(result.bins[0].endStationFormatted).toBe('km 0+100.00');
    });

    it('debe ubicar siniestros en los bins correctos y calcular densidades', () => {
      const alignment = createAlignment([
        { longitude: -77.0000, latitude: -12.0100 },
        { longitude: -77.0000, latitude: -12.0000 }
      ]);

      // Ubicar 2 siniestros en el tramo inicial y 1 fuera del buffer
      const crashes: CrashPoint[] = [
        {
          id: 'C1',
          coordinates: [-77.0000, -12.0098], // Muy cerca del inicio (~22m)
          severity: SeverityLevel.FATAL,
          type: CrashType.CHOQUE
        },
        {
          id: 'C2',
          coordinates: [-77.0000, -12.0095], // A ~55m del inicio
          severity: SeverityLevel.LESIONES_GRAVES,
          type: CrashType.ATROPELLO
        },
        {
          id: 'C3_OUT',
          coordinates: [-76.9990, -12.0095], // Desplazado ~100m fuera de calzada
          severity: SeverityLevel.SOLO_DANOS,
          type: CrashType.DESPISTE
        }
      ];

      const result = analyzeLrs(alignment, crashes, {
        bufferWidthMeters: 25,
        binSizeMeters: 100
      });

      expect(result.totalInputCrashes).toBe(3);
      expect(result.projectedInsideBufferCount).toBe(2);
      expect(result.projectedOutsideBufferCount).toBe(1);

      // El primer bin [0, 100m) debe tener los 2 siniestros dentro de faja
      const bin0 = result.bins[0];
      expect(bin0.totalCount).toBe(2);
      expect(bin0.severityCounts[SeverityLevel.FATAL]).toBe(1);
      expect(bin0.severityCounts[SeverityLevel.LESIONES_GRAVES]).toBe(1);
      expect(bin0.epdoScore).toBe(9.5 + 3.5); // 13.0
      // Densidad: 2 siniestros / 0.1 km = 20 siniestros/km
      expect(bin0.densityPerKm).toBe(20.0);
    });
  });
});
