import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import { buildVisQuillConfig } from '../../../src/pkg/viz/visquill-adapter.js';
import { generateCurvilinearProfile } from '../../../src/pkg/curvilinear/generator.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('SPEC-14: Conmutación de Modo de Métrica (COUNT, VEHICLES, PERSONS)', () => {
  const alignment = createAlignment([
    { longitude: -77.0, latitude: -12.0 },
    { longitude: -77.0, latitude: -12.009 }
  ], 'TEST-AXIS', 'Eje de Prueba Métrica');

  const crashes: CrashPoint[] = [
    {
      id: 'CRASH-01',
      coordinates: [-77.0, -12.001],
      severity: SeverityLevel.FATAL,
      type: CrashType.CHOQUE,
      vehiclesCount: 3,
      personsCount: 5,
      personsBreakdown: {
        fallecido: 2,
        lesionado: 2,
        noSeConoce: 0,
        ileso: 1
      }
    }
  ];

  const lrsResult = analyzeLrs(alignment, crashes, { bufferWidthMeters: 50, binSizeMeters: 200 });

  it('debe configurar VisQuill correctamente para el modo COUNT', () => {
    const config = buildVisQuillConfig(lrsResult, 'chart-test', 'COUNT');
    expect(config.yAxis.mode).toBe('COUNT');
    expect(config.yAxis.title).toContain('Siniestros');
    const binWithCrash = config.data.find((d) => d.totalValue > 0);
    expect(binWithCrash).toBeDefined();
    expect(binWithCrash?.totalValue).toBe(1);
    expect(binWithCrash?.totalVehicles).toBe(3);
    expect(binWithCrash?.totalPersons).toBe(5);
  });

  it('debe configurar VisQuill correctamente para el modo VEHICLES', () => {
    const config = buildVisQuillConfig(lrsResult, 'chart-test', 'VEHICLES');
    expect(config.yAxis.mode).toBe('VEHICLES');
    expect(config.yAxis.title).toContain('Vehículos');
    const binWithCrash = config.data.find((d) => d.totalValue > 0);
    expect(binWithCrash).toBeDefined();
    expect(binWithCrash?.totalValue).toBe(3); // Refleja 3 vehículos
  });

  it('debe configurar VisQuill correctamente para el modo PERSONS', () => {
    const config = buildVisQuillConfig(lrsResult, 'chart-test', 'PERSONS');
    expect(config.yAxis.mode).toBe('PERSONS');
    expect(config.yAxis.title).toContain('Personas');
    const binWithCrash = config.data.find((d) => d.totalValue > 0);
    expect(binWithCrash).toBeDefined();
    expect(binWithCrash?.totalValue).toBe(5); // Refleja 5 personas
    expect(binWithCrash?.personsBreakdown.fallecido).toBe(2);
    expect(binWithCrash?.personsBreakdown.lesionado).toBe(2);
    expect(binWithCrash?.personsBreakdown.ileso).toBe(1);
  });

  it('debe generar las alturas del perfil curvilíneo proporcionales al modo seleccionado', () => {
    const profileCount = generateCurvilinearProfile(alignment, lrsResult, {
      metricMode: 'COUNT',
      heightScaleMetersPerUnit: 10
    });
    const barCount = profileCount.bars.find((b) => b.value > 0);
    expect(barCount?.value).toBe(1);
    expect(barCount?.heightMeters).toBe(10); // 1 * 10

    const profileVehicles = generateCurvilinearProfile(alignment, lrsResult, {
      metricMode: 'VEHICLES',
      heightScaleMetersPerUnit: 10
    });
    const barVehicles = profileVehicles.bars.find((b) => b.value > 0);
    expect(barVehicles?.value).toBe(3);
    expect(barVehicles?.heightMeters).toBe(30); // 3 * 10

    const profilePersons = generateCurvilinearProfile(alignment, lrsResult, {
      metricMode: 'PERSONS',
      heightScaleMetersPerUnit: 10
    });
    const barsPersonsInBin = profilePersons.bars.filter((b) => b.binIndex === barCount?.binIndex);
    expect(barsPersonsInBin.length).toBeGreaterThanOrEqual(1);
    const totalHeight = barsPersonsInBin.reduce((sum, b) => sum + b.heightMeters, 0);
    expect(totalHeight).toBe(50); // 5 * 10
    const firstBar = barsPersonsInBin[0];
    expect(firstBar.totalVehicles).toBe(3);
    expect(firstBar.totalPersons).toBe(5);
    expect(firstBar.personsBreakdown?.fallecido).toBe(2);
  });
});
