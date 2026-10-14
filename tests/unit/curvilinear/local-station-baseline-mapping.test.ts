import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import {
  generateCurvilinearProfile,
  sampleBaselineAtStation,
  interpolateAtStation
} from '../../../src/pkg/curvilinear/generator.js';
import { computeSmoothedVertexNormals, offsetCoordinate } from '../../../src/pkg/curvilinear/normals.js';
import {
  computePointerGeometry,
  projectPointToBaselineArcLength
} from '../../../src/pkg/curvilinear/pointer.js';
import { untanglePolylineWithStations } from '../../../src/pkg/curvilinear/anti-knot.js';
import { haversineDistance } from '../../../src/pkg/tracer/geodesy.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('Local Station-Coordinated Baseline Mapping - SPEC-27 Compliance', () => {
  // Alineamiento realista con múltiples curvas consecutivas (3,000 m aprox)
  const multiCurveAlignment = createAlignment([
    { longitude: -77.0000, latitude: -12.0000 },
    { longitude: -77.0000, latitude: -12.0080 }, // Tramo recto sur (~880m)
    { longitude: -76.9950, latitude: -12.0120 }, // Curva diagonal sureste (~700m)
    { longitude: -76.9950, latitude: -12.0200 }, // Tramo recto sur (~880m)
    { longitude: -76.9900, latitude: -12.0230 }  // Curva final sureste (~650m)
  ]);

  const offsetDist = 300; // 300 metros
  const vertexNormals = computeSmoothedVertexNormals(multiCurveAlignment.vertices, multiCurveAlignment.segments, 3);

  it('debe cumplir con Test Case 27.1: Desviación acotada (<= 25m) respecto a la proyección ortogonal pura en curvas', () => {
    const results = analyzeLrs(multiCurveAlignment, []);
    const profile = generateCurvilinearProfile(multiCurveAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      smoothingWindowSize: 3
    });

    expect(profile.baselineProfile).toBeDefined();
    expect(profile.baselineProfile?.stations).toBeDefined();

    // Evaluar en múltiples estaciones a lo largo de todo el corredor vial, incluyendo zonas de curva
    const testStations = [100, 500, 850, 1200, 1600, 2100, 2600, 2900];

    for (const s of testStations) {
      if (s >= multiCurveAlignment.totalLength) continue;

      // 1. Proyección ortogonal pura sin suavizado
      const road = interpolateAtStation(multiCurveAlignment, vertexNormals, s);
      const pureOffset = offsetCoordinate(
        road.coord,
        road.normal,
        offsetDist
      );

      // 2. Mapeo estacionado local sobre la línea base
      const mapped = sampleBaselineAtStation(profile.baselineProfile!, s);

      // 3. Distancia entre el punto mapeado y la proyección pura
      const dev = haversineDistance(
        { longitude: pureOffset[0], latitude: pureOffset[1] },
        { longitude: mapped.coord[0], latitude: mapped.coord[1] }
      );

      // En el modelo anterior con arco global, dev superaba los 150m-300m en curvas.
      // Con SPEC-27, dev está acotada estrictamente por el radio de suavizado gaussiano (<= 25 m).
      expect(dev).toBeLessThanOrEqual(25.0);
    }
  });

  it('debe cumplir con Test Case 27.2: Conector del puntero casi ortogonal con longitud acotada [D_offset - 30m, D_offset + 30m]', () => {
    const results = analyzeLrs(multiCurveAlignment, []);
    const profile = generateCurvilinearProfile(multiCurveAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT'
    });

    const testStations = [200, 800, 1100, 1500, 2000, 2500];

    for (const s of testStations) {
      const pointerGeom = computePointerGeometry(
        multiCurveAlignment,
        s,
        offsetDist,
        'RIGHT',
        3,
        profile.baselineProfile
      );

      const roadPt = pointerGeom.roadCoord;
      const basePt = pointerGeom.baselineCoord;

      const connectorLen = haversineDistance(
        { longitude: roadPt[0], latitude: roadPt[1] },
        { longitude: basePt[0], latitude: basePt[1] }
      );

      // La longitud del conector no debe desviarse en diagonal: debe mantenerse cercana a offsetDist
      expect(connectorLen).toBeGreaterThanOrEqual(offsetDist - 30);
      expect(connectorLen).toBeLessThanOrEqual(offsetDist + 30);
    }
  });

  it('debe cumplir con Test Case 27.3: Posición coherente de barras frente a siniestros sin deriva longitudinal acumulada', () => {
    // Siniestro en la progresiva 2,200 m (después de 2 curvas)
    const crashStation = 2200;
    const roadInterp = interpolateAtStation(multiCurveAlignment, vertexNormals, crashStation);
    const roadPt: [number, number] = [roadInterp.coord.longitude, roadInterp.coord.latitude];

    const crashes: CrashPoint[] = [
      {
        id: 'CRASH-CURVE-2200',
        coordinates: roadPt,
        severity: SeverityLevel.FATAL,
        type: CrashType.CHOQUE
      }
    ];

    const results = analyzeLrs(multiCurveAlignment, crashes, { binSizeMeters: 100 });
    const profile = generateCurvilinearProfile(multiCurveAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT'
    });

    expect(profile.bars.length).toBe(1);
    const bar = profile.bars[0];

    // La base de la barra debe estar inmediatamente al frente del siniestro
    const barBaseCoord = bar.polygonCoordinates[0];
    const distToCrash = haversineDistance(
      { longitude: roadPt[0], latitude: roadPt[1] },
      { longitude: barBaseCoord[0], latitude: barBaseCoord[1] }
    );

    // Debe encontrarse a la distancia de offset con margen de curvatura local (no a 400m+ por deriva)
    expect(distToCrash).toBeGreaterThanOrEqual(offsetDist - 25);
    expect(distToCrash).toBeLessThanOrEqual(offsetDist + 25);
  });

  it('debe cumplir con Test Case 27.4: Proyección inversa 1D sobre la línea base retorna la estación vial correcta', () => {
    const results = analyzeLrs(multiCurveAlignment, []);
    const profile = generateCurvilinearProfile(multiCurveAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT'
    });

    const targetStation = 1450;
    const baselineSample = sampleBaselineAtStation(profile.baselineProfile!, targetStation);

    // Proyectar la coordenada de la línea base hacia atrás
    const proj = projectPointToBaselineArcLength(
      profile.baselineProfile!,
      baselineSample.coord,
      multiCurveAlignment.totalLength
    );

    expect(proj.stationMeters).toBeDefined();
    // La progresiva recuperada debe ser casi idéntica a targetStation (error < 5m)
    expect(Math.abs(proj.stationMeters! - targetStation)).toBeLessThan(5.0);
  });

  it('debe cumplir con Test Case 27.5: Desenredo anti-nudo con preservación de estaciones', () => {
    // Polilínea de prueba que forma un auto-bucle (nudo)
    const knottedCoords: [number, number][] = [
      [-77.000, -12.000],
      [-77.001, -12.001],
      [-77.001, -12.000], // cruza hacia atrás
      [-77.000, -12.001],
      [-77.000, -12.003]
    ];
    const initialStations = [0, 100, 200, 300, 400];

    const result = untanglePolylineWithStations(knottedCoords, initialStations, 5);

    expect(result.coordinates.length).toBe(result.stations.length);
    // Las estaciones resultantes deben ser estrictamente monótonas crecientes
    for (let i = 0; i < result.stations.length - 1; i++) {
      expect(result.stations[i + 1]).toBeGreaterThanOrEqual(result.stations[i]);
    }
  });
});
