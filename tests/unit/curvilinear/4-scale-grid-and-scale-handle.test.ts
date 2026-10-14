import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import {
  generateCurvilinearProfile,
  compute4ScaleTicks
} from '../../../src/pkg/curvilinear/generator.js';
import {
  computePointerGeometry,
  computeScaleHandleCoordinate,
  projectPointToGridRay,
  convertDragToHeightScale
} from '../../../src/pkg/curvilinear/pointer.js';
import { haversineDistance, offsetCoordinate } from '../../../src/pkg/tracer/geodesy.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('4-Scale Radial Grid & Constrained Scale Handle - SPEC-28 Compliance', () => {
  // Eje vial recto de 2,000 m
  const alignment = createAlignment([
    { longitude: -77.0000, latitude: -12.0180 },
    { longitude: -77.0000, latitude: -12.0000 }
  ]);

  it('debe cumplir con Test Case 28.1: La grilla siempre debe generar exactamente 4 escalas concéntricas regulares', () => {
    // 1. Probar función directa compute4ScaleTicks
    const ticksZero = compute4ScaleTicks(0);
    expect(ticksZero).toHaveLength(4);
    expect(ticksZero).toEqual([10, 20, 30, 40]);

    const ticksSmall = compute4ScaleTicks(7);
    expect(ticksSmall).toHaveLength(4);
    expect(ticksSmall[0]).toBeGreaterThan(0);
    expect(ticksSmall[3]).toBeGreaterThanOrEqual(7);
    // Verificar regularidad S, 2S, 3S, 4S
    const stepSmall = ticksSmall[0];
    expect(ticksSmall).toEqual([stepSmall, stepSmall * 2, stepSmall * 3, stepSmall * 4]);

    const ticksMedium = compute4ScaleTicks(75);
    expect(ticksMedium).toHaveLength(4);
    expect(ticksMedium[3]).toBeGreaterThanOrEqual(75);

    const ticksLarge = compute4ScaleTicks(300);
    expect(ticksLarge).toHaveLength(4);
    expect(ticksLarge).toEqual([75, 150, 225, 300]);

    const ticksHuge = compute4ScaleTicks(900);
    expect(ticksHuge).toHaveLength(4);
    expect(ticksHuge).toEqual([250, 500, 750, 1000]);

    // 2. Probar generateCurvilinearProfile con o sin datos
    const emptyResults = analyzeLrs(alignment, []);
    const emptyProfile = generateCurvilinearProfile(alignment, emptyResults);
    expect(emptyProfile.isolines).toHaveLength(4);

    const crashes: CrashPoint[] = [
      { id: 'C1', coordinates: [-77.0000, -12.0100], severity: SeverityLevel.FATAL, type: CrashType.CHOQUE }
    ];
    const results = analyzeLrs(alignment, crashes, { binSizeMeters: 100 });
    const profile = generateCurvilinearProfile(alignment, results);
    expect(profile.isolines).toHaveLength(4);
    expect(profile.isolines.map((iso) => iso.tickValue)).toEqual(compute4ScaleTicks(1));
  });

  it('debe cumplir con Test Case 28.2: El botón rectangular se posiciona por defecto en el primer nivel de la grilla (más abajo)', () => {
    const s = 1000;
    const offset = 600;
    const d1 = 200; // metros al primer nivel de la grilla
    const pointerGeom = computePointerGeometry(alignment, s, offset, 'RIGHT');

    // Por defecto gridLevel = 1.0 (primer nivel)
    const scaleGeom = computeScaleHandleCoordinate(
      alignment,
      s,
      offset,
      40,
      'RIGHT',
      3,
      undefined,
      1.0,
      d1
    );

    expect(scaleGeom.gridLevel).toBe(1.0);
    expect(scaleGeom.distanceAlongNormal).toBe(d1);

    // La distancia geográfica desde la baseline hasta el botón debe ser exactamente d1
    const dist = haversineDistance(
      { longitude: pointerGeom.baselineCoord[0], latitude: pointerGeom.baselineCoord[1] },
      { longitude: scaleGeom.handleCoord[0], latitude: scaleGeom.handleCoord[1] }
    );
    expect(dist).toBeCloseTo(d1, 0);
  });

  it('debe cumplir con Test Case 28.3: Confinamiento 1D estricto sobre el rayo transversal de la grilla sin desplazamiento lateral', () => {
    const s = 1000;
    const offset = 600;
    const d1 = 150;
    const pointerGeom = computePointerGeometry(alignment, s, offset, 'RIGHT');

    // Cursor arrastrado con desviación diagonal/lateral intencional (500m hacia el norte)
    const strayCursor: [number, number] = [
      pointerGeom.baselineCoord[0] + 0.003, // hacia el este
      pointerGeom.baselineCoord[1] + 0.005  // desvío parásito hacia el norte
    ];

    const proj = projectPointToGridRay(
      pointerGeom.baselineCoord,
      strayCursor,
      pointerGeom.normalVector,
      d1
    );

    // El punto proyectado debe estar estrictamente a lo largo del vector normal (misma latitud para eje S-N con normal Este)
    expect(proj.clampedCoord[1]).toBeCloseTo(pointerGeom.baselineCoord[1], 4);
    expect(proj.clampedCoord[0]).toBeGreaterThan(pointerGeom.baselineCoord[0]);

    // La distancia debe estar acotada entre [0.25 * d1, 4.0 * d1]
    expect(proj.clampedDistanceMeters).toBeGreaterThanOrEqual(0.25 * d1);
    expect(proj.clampedDistanceMeters).toBeLessThanOrEqual(4.0 * d1);
  });

  it('debe cumplir con Test Case 28.4: Estabilidad en escalas específicas (1, 2, 3, 4) y entre escalas (ej. 1.5, 2.7)', () => {
    const s = 1000;
    const offset = 600;
    const d1 = 100;
    const pointerGeom = computePointerGeometry(alignment, s, offset, 'RIGHT');

    const testLevels = [1.0, 1.5, 2.0, 2.75, 3.0, 4.0];

    for (const lvl of testLevels) {
      const geom = computeScaleHandleCoordinate(
        alignment,
        s,
        offset,
        40,
        'RIGHT',
        3,
        undefined,
        lvl,
        d1
      );

      expect(geom.gridLevel).toBe(lvl);
      expect(geom.distanceAlongNormal).toBeCloseTo(lvl * d1, 1);

      const actualDist = haversineDistance(
        { longitude: pointerGeom.baselineCoord[0], latitude: pointerGeom.baselineCoord[1] },
        { longitude: geom.handleCoord[0], latitude: geom.handleCoord[1] }
      );
      expect(actualDist).toBeCloseTo(lvl * d1, 0);
    }
  });

  it('debe cumplir con Test Case 28.5: Manipulación reactiva de la escala y altura de las barras según el nivel', () => {
    const crashes: CrashPoint[] = [
      { id: 'C-01', coordinates: [-77.0000, -12.0100], severity: SeverityLevel.FATAL, type: CrashType.CHOQUE }
    ];
    const results = analyzeLrs(alignment, crashes, { binSizeMeters: 100 });

    // Perfil a escala base (Nivel 1 -> 40 m/u)
    const profileLevel1 = generateCurvilinearProfile(alignment, results, {
      heightScaleMetersPerUnit: 40
    });

    // Perfil al doble de escala (Nivel 2 -> 80 m/u)
    const profileLevel2 = generateCurvilinearProfile(alignment, results, {
      heightScaleMetersPerUnit: 80
    });

    expect(profileLevel1.bars.length).toBe(1);
    expect(profileLevel2.bars.length).toBe(1);

    const bar1 = profileLevel1.bars[0];
    const bar2 = profileLevel2.bars[0];

    // La barra a Nivel 2 debe tener exactamente el doble de altura métrica que a Nivel 1
    expect(bar2.heightMeters).toBeCloseTo(bar1.heightMeters * 2, 1);

    // Ambas grillas deben mantener exactamente 4 isolíneas
    expect(profileLevel1.isolines).toHaveLength(4);
    expect(profileLevel2.isolines).toHaveLength(4);
  });
});
