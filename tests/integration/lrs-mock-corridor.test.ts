import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseGeoJsonAlignment } from '../../src/pkg/tracer/importers/geojson.js';
import { analyzeLrs } from '../../src/pkg/lrs/aggregator.js';
import { CrashPoint } from '../../src/pkg/lrs/types.js';

describe('Integration Test: LRS Engine con Corredor Panamericana Sur (Mock Dataset)', () => {
  it('debe procesar el alineamiento de 7.6 km y 75 siniestros dentro del presupuesto de tiempo', () => {
    // 1. Cargar alineamiento simulado
    const alignmentPath = path.resolve(process.cwd(), 'mock/alignment.geojson');
    const alignmentJson = fs.readFileSync(alignmentPath, 'utf-8');
    const alignment = parseGeoJsonAlignment(alignmentJson);

    expect(alignment.totalLength).toBeGreaterThan(7600);

    // 2. Cargar siniestros simulados
    const crashesPath = path.resolve(process.cwd(), 'mock/crashes.json');
    const crashes: CrashPoint[] = JSON.parse(fs.readFileSync(crashesPath, 'utf-8'));

    expect(crashes).toHaveLength(75);

    // 3. Ejecutar motor LRS con buffer de 25m y bins de 100m
    const result = analyzeLrs(alignment, crashes, {
      bufferWidthMeters: 25,
      binSizeMeters: 100
    });

    // 4. Verificaciones de integridad
    expect(result.totalInputCrashes).toBe(75);
    expect(result.projectedInsideBufferCount + result.projectedOutsideBufferCount).toBe(75);
    expect(result.projectedInsideBufferCount).toBeGreaterThan(50); // Mayoría cae dentro de 25m
    expect(result.projectedOutsideBufferCount).toBeGreaterThan(0);  // Algunos caen fuera

    // Bins para 7.63 km en intervalos de 100m -> ~77 bins
    expect(result.bins.length).toBeGreaterThanOrEqual(76);
    expect(result.bins.length).toBeLessThanOrEqual(78);

    // Verificar que la suma de siniestros en los bins sea igual a los siniestros dentro de faja
    const totalInBins = result.bins.reduce((sum, b) => sum + b.totalCount, 0);
    expect(totalInBins).toBe(result.projectedInsideBufferCount);

    // 5. Presupuesto de Rendimiento: DoD de SPEC-03 exige <= 45 ms
    expect(result.executionTimeMs).toBeLessThanOrEqual(45);

    // 6. Verificar que los hotspots generados (ej. en km 1+400, km 3+800) tienen mayor EPDO
    const binsWithCrashes = result.bins.filter((b) => b.totalCount > 0);
    expect(binsWithCrashes.length).toBeGreaterThan(0);

    // Al menos un tramo crítico de alta siniestralidad con EPDO significativo
    const maxEpdoBin = result.bins.reduce((max, b) => (b.epdoScore > max.epdoScore ? b : max), result.bins[0]);
    expect(maxEpdoBin.epdoScore).toBeGreaterThan(15);
  });
});
