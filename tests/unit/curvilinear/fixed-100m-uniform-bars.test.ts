import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import { generateCurvilinearProfile } from '../../../src/pkg/curvilinear/generator.js';
import { FIXED_BIN_SIZE_METERS } from '../../../src/pkg/curvilinear/viewport.js';
import { haversineDistance } from '../../../src/pkg/tracer/geodesy.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('SPEC-25: Segmentación Métrica Fija a 100m y Barras de Ancho Uniforme', () => {
  it('debe definir la constante FIXED_BIN_SIZE_METERS exactamente en 100 m', () => {
    expect(FIXED_BIN_SIZE_METERS).toBe(100);
  });

  it('debe cumplir con Test Case 25.1: Todas las barras generadas tienen ancho uniforme idéntico', () => {
    // Eje recto de 2,000 metros (20 bins de 100 metros)
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0180 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    // Tres siniestros en bins distintos y distantes (ej. bin 1, bin 5, bin 15)
    const crashes: CrashPoint[] = [
      { id: 'C-01', coordinates: [-77.0000, -12.0165], severity: SeverityLevel.FATAL, type: CrashType.CHOQUE },
      { id: 'C-02', coordinates: [-77.0000, -12.0130], severity: SeverityLevel.LESIONES_GRAVES, type: CrashType.DESPISTE },
      { id: 'C-03', coordinates: [-77.0000, -12.0040], severity: SeverityLevel.SOLO_DANOS, type: CrashType.CHOQUE }
    ];

    const results = analyzeLrs(alignment, crashes, { binSizeMeters: FIXED_BIN_SIZE_METERS });
    const profile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: 600,
      side: 'RIGHT'
    });

    expect(profile.bars).toHaveLength(3);

    // Calcular los anchos de base de cada una de las 3 barras sobre la baseline
    const widths = profile.bars.map((bar) => {
      const pStart = bar.polygonCoordinates[0];
      const pEnd = bar.polygonCoordinates[3];
      return haversineDistance(
        { longitude: pStart[0], latitude: pStart[1] },
        { longitude: pEnd[0], latitude: pEnd[1] }
      );
    });

    // Cada ancho debe estar muy cercano a 100 metros (resolución fija de 100m)
    for (const w of widths) {
      expect(w).toBeGreaterThanOrEqual(95);
      expect(w).toBeLessThanOrEqual(105);
    }

    // Los anchos entre sí deben ser virtualmente idénticos (diferencia < 2 metros)
    const diff1 = Math.abs(widths[0] - widths[1]);
    const diff2 = Math.abs(widths[1] - widths[2]);
    expect(diff1).toBeLessThan(2.0);
    expect(diff2).toBeLessThan(2.0);
  });

  it('debe cumplir con Test Case 25.2: Tramos sin datos permanecen en 0 y no generan barras intermedias', () => {
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0100 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    // Un único siniestro en un eje de 10 bins (1,000m)
    const crashes: CrashPoint[] = [
      { id: 'SOLO-UNO', coordinates: [-77.0000, -12.0050], severity: SeverityLevel.FATAL, type: CrashType.CHOQUE }
    ];

    const results = analyzeLrs(alignment, crashes, { binSizeMeters: FIXED_BIN_SIZE_METERS });
    const profile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: 500
    });

    // Solo debe existir la barra del bin que contiene el siniestro
    expect(profile.bars).toHaveLength(1);
    expect(profile.bars[0].value).toBe(1);

    // Los otros 9 bins no deben generar ningún polígono
    expect(profile.bars.every((b) => b.value > 0)).toBe(true);
  });
});
