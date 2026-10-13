import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import { generateCurvilinearProfile } from '../../../src/pkg/curvilinear/generator.js';
import { buildCurvilinearMapLibreLayers } from '../../../src/pkg/curvilinear/maplibre-layers.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('Barras Curvilíneas Apiladas por Gravedad de Personas (SPEC-17)', () => {
  const alignment = createAlignment([
    { longitude: -77.0000, latitude: -12.0090 },
    { longitude: -77.0000, latitude: -12.0000 }
  ]);

  it('debe extruir sub-polígonos apilados ortogonalmente cuando metricMode es PERSONS', () => {
    const crashes: CrashPoint[] = [
      {
        id: 'C-01',
        coordinates: [-77.0000, -12.0085], // Dentro del primer bin [0, 100m)
        severity: SeverityLevel.FATAL,
        type: CrashType.CHOQUE,
        vehiclesCount: 2,
        personsCount: 5,
        personsBreakdown: {
          fallecido: 2,
          lesionado: 1,
          noSeConoce: 0,
          ileso: 2
        }
      }
    ];

    const results = analyzeLrs(alignment, crashes, { binSizeMeters: 100 });
    const profile = generateCurvilinearProfile(alignment, results, {
      metricMode: 'PERSONS',
      offsetDistanceMeters: 500,
      heightScaleMetersPerUnit: 20
    });

    // El primer bin debe tener 3 sub-polígonos (Fallecido: 2, Lesionado: 1, Ileso: 2)
    const bin0Bars = profile.bars.filter((b) => b.binIndex === 0);
    expect(bin0Bars).toHaveLength(3);

    // 1. Capa inferior: Fallecido
    const sliceFatal = bin0Bars.find((b) => b.subCategory === 'FALLECIDO');
    expect(sliceFatal).toBeDefined();
    expect(sliceFatal?.subCount).toBe(2);
    expect(sliceFatal?.heightMeters).toBe(40); // 2 * 20m
    expect(sliceFatal?.fillColor).toBe('#DC2626');

    // 2. Capa intermedia: Lesionado
    const sliceLesionado = bin0Bars.find((b) => b.subCategory === 'LESIONADO');
    expect(sliceLesionado).toBeDefined();
    expect(sliceLesionado?.subCount).toBe(1);
    expect(sliceLesionado?.heightMeters).toBe(20); // 1 * 20m
    expect(sliceLesionado?.fillColor).toBe('#EA580C');

    // 3. Capa exterior: Ileso
    const sliceIleso = bin0Bars.find((b) => b.subCategory === 'ILESO');
    expect(sliceIleso).toBeDefined();
    expect(sliceIleso?.subCount).toBe(2);
    expect(sliceIleso?.heightMeters).toBe(40); // 2 * 20m
    expect(sliceIleso?.fillColor).toBe('#10B981');

    // La suma acumulada de alturas debe ser exactamente 5 * 20 = 100m
    const totalHeight = bin0Bars.reduce((sum, b) => sum + b.heightMeters, 0);
    expect(totalHeight).toBe(100);
  });

  it('debe mantener extrusión simple para otros modos métricos como COUNT o VEHICLES', () => {
    const crashes: CrashPoint[] = [
      {
        id: 'C-02',
        coordinates: [-77.0000, -12.0085],
        severity: SeverityLevel.FATAL,
        type: CrashType.CHOQUE,
        vehiclesCount: 3,
        personsCount: 4
      }
    ];

    const results = analyzeLrs(alignment, crashes, { binSizeMeters: 100 });
    const profile = generateCurvilinearProfile(alignment, results, {
      metricMode: 'VEHICLES',
      offsetDistanceMeters: 500,
      heightScaleMetersPerUnit: 15
    });

    const bin0Bars = profile.bars.filter((b) => b.binIndex === 0);
    expect(bin0Bars).toHaveLength(1);
    expect(bin0Bars[0].value).toBe(3);
    expect(bin0Bars[0].heightMeters).toBe(45); // 3 * 15m
    expect(bin0Bars[0].fillColor).toBe('#0284C7');
  });

  it('debe propagar los colores apilados a las capas MapLibre GL JS', () => {
    const crashes: CrashPoint[] = [
      {
        id: 'C-03',
        coordinates: [-77.0000, -12.0085],
        severity: SeverityLevel.FATAL,
        type: CrashType.CHOQUE,
        personsCount: 2,
        personsBreakdown: {
          fallecido: 1,
          lesionado: 0,
          noSeConoce: 0,
          ileso: 1
        }
      }
    ];

    const results = analyzeLrs(alignment, crashes, { binSizeMeters: 100 });
    const profile = generateCurvilinearProfile(alignment, results, {
      metricMode: 'PERSONS',
      offsetDistanceMeters: 500
    });

    const mapBundle = buildCurvilinearMapLibreLayers(profile);
    const barsSource = mapBundle.sources.find((s) => s.id === 'source-curvilinear-bars');
    expect(barsSource).toBeDefined();

    const features = barsSource?.data.features;
    expect(features.length).toBeGreaterThanOrEqual(2);

    const fatalFeature = features.find((f: any) => f.properties.subCategory === 'FALLECIDO');
    const ilesoFeature = features.find((f: any) => f.properties.subCategory === 'ILESO');

    expect(fatalFeature?.properties.barColor).toBe('#DC2626');
    expect(ilesoFeature?.properties.barColor).toBe('#10B981');
  });
});
