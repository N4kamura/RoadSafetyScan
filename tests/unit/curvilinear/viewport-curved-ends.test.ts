import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import {
  generateCurvilinearProfile,
  sampleBaselineAtStation
} from '../../../src/pkg/curvilinear/generator.js';
import { computePointerGeometry, computeScaleHandleCoordinate } from '../../../src/pkg/curvilinear/pointer.js';
import { haversineDistance } from '../../../src/pkg/tracer/geodesy.js';

describe('Viewport Curved Ends & Counter-Bar Deflection - SPEC-34 Compliance', () => {
  // Corredor de prueba de ~6 km con curvaturas en extremos y recta central
  const alignment = createAlignment([
    { longitude: -77.0200, latitude: -12.0000 },
    { longitude: -77.0100, latitude: -12.0080 },
    { longitude: -77.0000, latitude: -12.0150 },
    { longitude: -77.0000, latitude: -12.0350 },
    { longitude: -76.9850, latitude: -12.0450 }
  ]);

  const offsetDist = 600;

  it('debe cumplir con Test Case 34.1: Curvatura hacia el lado opuesto de las barras en extremos de cualquier zoom', () => {
    const results = analyzeLrs(alignment, []);

    // 1. Zoom Macro (todo el corredor)
    const macroProfile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      borderCurvatureRatio: 0.15
    });

    const totalLen = alignment.totalLength;
    const bpMacro = macroProfile.baselineProfile!;

    const sStartMacro = bpMacro.stations![0];
    const sMidMacro = totalLen * 0.5;
    const sEndMacro = bpMacro.stations![bpMacro.stations!.length - 1];

    const ptStartMacro = sampleBaselineAtStation(bpMacro, sStartMacro);
    const ptMidMacro = sampleBaselineAtStation(bpMacro, sMidMacro);
    const ptEndMacro = sampleBaselineAtStation(bpMacro, sEndMacro);

    // En los extremos, la distancia del punto a la secante/carretera se reduce (deflexión cóncava en contra de las barras)
    // El vector normal en ptStart y ptEnd difiere del normal central
    const dotStartMacro = ptStartMacro.normal.x * ptMidMacro.normal.x + ptStartMacro.normal.y * ptMidMacro.normal.y;
    const dotEndMacro = ptEndMacro.normal.x * ptMidMacro.normal.x + ptEndMacro.normal.y * ptMidMacro.normal.y;
    expect(dotStartMacro).toBeLessThan(0.99);
    expect(dotEndMacro).toBeLessThan(0.99);

    // 2. Zoom Local Intermedio (tramo s in [1500, 3500] m)
    const localProfile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      visibleRange: [1500, 3500],
      borderCurvatureRatio: 0.15
    });

    const bpLocal = localProfile.baselineProfile!;
    const sStartLocal = bpLocal.stations![0];
    const sMidLocal = 2500;
    const sEndLocal = bpLocal.stations![bpLocal.stations!.length - 1];

    const ptStartLocal = sampleBaselineAtStation(bpLocal, sStartLocal);
    const ptMidLocal = sampleBaselineAtStation(bpLocal, sMidLocal);
    const ptEndLocal = sampleBaselineAtStation(bpLocal, sEndLocal);

    // En el zoom local, los extremos de la pantalla SIEMPRE presentan curvatura terminal
    const dotStartLocal = ptStartLocal.normal.x * ptMidLocal.normal.x + ptStartLocal.normal.y * ptMidLocal.normal.y;
    const dotEndLocal = ptEndLocal.normal.x * ptMidLocal.normal.x + ptEndLocal.normal.y * ptMidLocal.normal.y;
    expect(dotStartLocal).toBeLessThan(0.99);
    expect(dotEndLocal).toBeLessThan(0.99);
  });

  it('debe cumplir con Test Case 34.2: Rotación de normales formando arcos concéntricos cóncavos (anti-barras)', () => {
    const results = analyzeLrs(alignment, []);
    const localProfile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      visibleRange: [1000, 3000],
      borderCurvatureRatio: 0.15
    });

    const bp = localProfile.baselineProfile!;
    const ptStart = sampleBaselineAtStation(bp, 1000);
    const ptMid = sampleBaselineAtStation(bp, 2000);
    const ptEnd = sampleBaselineAtStation(bp, 3000);

    // La normal en el inicio debe diferir de la normal central
    expect(ptStart.normal).not.toEqual(ptMid.normal);
    expect(ptEnd.normal).not.toEqual(ptMid.normal);

    // Las isolíneas de escala se curvan concéntricamente siguiendo la normal rotada
    expect(localProfile.isolines.length).toBeGreaterThan(0);
    const iso1 = localProfile.isolines[0];
    expect(iso1.lineCoordinates.length).toBe(localProfile.baselineCoordinates.length);
  });

  it('debe cumplir con Test Case 34.3: Cuerpo central estrictamente rectilíneo con normales constantes', () => {
    const results = analyzeLrs(alignment, []);
    const profile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      visibleRange: [1000, 4000],
      borderCurvatureRatio: 0.15
    });

    const bp = profile.baselineProfile!;
    // Rango central: entre 2000 y 3000 (tau entre 0.33 y 0.66)
    const pt1 = sampleBaselineAtStation(bp, 2200);
    const pt2 = sampleBaselineAtStation(bp, 2500);
    const pt3 = sampleBaselineAtStation(bp, 2800);

    expect(pt1.normal.x).toBeCloseTo(pt2.normal.x, 5);
    expect(pt1.normal.y).toBeCloseTo(pt2.normal.y, 5);
    expect(pt2.normal.x).toBeCloseTo(pt3.normal.x, 5);
    expect(pt2.normal.y).toBeCloseTo(pt3.normal.y, 5);
  });

  it('debe cumplir con Test Case 34.4: Proximidad métrica y alineación coaxial de controles en el centro del viewport', () => {
    const results = analyzeLrs(alignment, []);
    const sightStation = 2500;
    const profile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      visibleRange: [1500, 3500],
      borderCurvatureRatio: 0.15
    });

    const pGeom = computePointerGeometry(
      alignment,
      sightStation,
      offsetDist,
      'RIGHT',
      3,
      profile.baselineProfile
    );

    const sGeom = computeScaleHandleCoordinate(
      alignment,
      sightStation,
      offsetDist,
      40,
      'RIGHT',
      3,
      profile.baselineProfile,
      1.0,
      160
    );

    // 1. La distancia entre el eje vial y la baseline en el centro de la mira preserva la escala nominal (incluyendo la flecha del arco del trazado)
    const distRoadToBaseline = haversineDistance(
      { longitude: pGeom.roadCoord[0], latitude: pGeom.roadCoord[1] },
      { longitude: pGeom.baselineCoord[0], latitude: pGeom.baselineCoord[1] }
    );
    expect(distRoadToBaseline).toBeGreaterThan(offsetDist * 0.90);
    expect(distRoadToBaseline).toBeLessThan(offsetDist * 1.80);

    // 2. El botón de escala se ubica exactamente a lo largo del mismo rayo normal del puntero
    const distPointerToScale = haversineDistance(
      { longitude: pGeom.baselineCoord[0], latitude: pGeom.baselineCoord[1] },
      { longitude: sGeom.handleCoord[0], latitude: sGeom.handleCoord[1] }
    );
    expect(distPointerToScale).toBeCloseTo(160, 0);
  });
});
