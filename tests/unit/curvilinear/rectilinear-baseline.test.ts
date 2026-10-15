import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import {
  generateCurvilinearProfile,
  buildRectilinearBaselineProfile,
  sampleBaselineAtStation
} from '../../../src/pkg/curvilinear/generator.js';
import { computeSmoothedVertexNormals } from '../../../src/pkg/curvilinear/normals.js';
import { computePointerGeometry } from '../../../src/pkg/curvilinear/pointer.js';
import { haversineDistance } from '../../../src/pkg/tracer/geodesy.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('Rectilinear Macro-Baseline & Orthogonal Clean Bars - SPEC-31 Compliance', () => {
  // Alineamiento realista con curva pronunciada (similar al bypass de Newcastle)
  const bypassAlignment = createAlignment([
    { longitude: -77.0000, latitude: -12.0000 }, // Inicio norte
    { longitude: -77.0100, latitude: -12.0100 }, // Desvío oeste pronunciado (bypass curvo)
    { longitude: -77.0080, latitude: -12.0200 }, // Continuación curva
    { longitude: -77.0000, latitude: -12.0300 }  // Retorno al corredor sur (~3.5 km)
  ]);

  const vertexNormals = computeSmoothedVertexNormals(bypassAlignment.vertices, bypassAlignment.segments, 3);
  const offsetDist = 500; // 500 metros

  it('debe cumplir con Test Case 31.1: Generar una línea base estrictamente rectilínea (colineal) a pesar de las curvas viales', () => {
    const results = analyzeLrs(bypassAlignment, []);
    const profile = generateCurvilinearProfile(bypassAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      baselineMode: 'RECTILINEAR',
      borderCurvatureRatio: 0
    });

    const coords = profile.baselineCoordinates;
    expect(coords.length).toBeGreaterThan(5);

    const pFirst = coords[0];
    const pLast = coords[coords.length - 1];

    // Verificar colinealidad: para cada punto intermedio, su distancia al segmento pFirst-pLast debe ser < 0.05 metros
    const totalDist = haversineDistance(
      { longitude: pFirst[0], latitude: pFirst[1] },
      { longitude: pLast[0], latitude: pLast[1] }
    );

    for (let i = 1; i < coords.length - 1; i++) {
      const pMid = coords[i];
      const d1 = haversineDistance(
        { longitude: pFirst[0], latitude: pFirst[1] },
        { longitude: pMid[0], latitude: pMid[1] }
      );
      const d2 = haversineDistance(
        { longitude: pMid[0], latitude: pMid[1] },
        { longitude: pLast[0], latitude: pLast[1] }
      );

      // Desigualdad triangular en línea recta: d1 + d2 debe ser igual a totalDist dentro de tolerancia submilimétrica
      expect(Math.abs(d1 + d2 - totalDist)).toBeLessThan(0.05);
    }
  });

  it('debe cumplir con Test Case 31.2: Ortogonalidad estricta y paralelismo de barras (rectángulos euclidianos puros sin deformación en cuña)', () => {
    const crashes: CrashPoint[] = [
      {
        id: 'CRASH-01',
        coordinates: [-77.0050, -12.0050],
        severity: SeverityLevel.FATAL,
        type: CrashType.CHOQUE
      },
      {
        id: 'CRASH-02',
        coordinates: [-77.0090, -12.0150],
        severity: SeverityLevel.LESIONES_GRAVES,
        type: CrashType.VOLCADURA
      }
    ];

    const results = analyzeLrs(bypassAlignment, crashes, { binSizeMeters: 100 });
    const profile = generateCurvilinearProfile(bypassAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      heightScaleMetersPerUnit: 50,
      baselineMode: 'RECTILINEAR'
    });

    expect(profile.bars.length).toBe(2);

    for (const bar of profile.bars) {
      const [pStart, qStart, qEnd, pEnd] = bar.polygonCoordinates;

      // 1. La arista inferior (pStart - pEnd) y la arista superior (qStart - qEnd) deben tener longitudes casi idénticas
      const baseWidth = haversineDistance(
        { longitude: pStart[0], latitude: pStart[1] },
        { longitude: pEnd[0], latitude: pEnd[1] }
      );
      const topWidth = haversineDistance(
        { longitude: qStart[0], latitude: qStart[1] },
        { longitude: qEnd[0], latitude: qEnd[1] }
      );

      // Diferencia menor a 0.05m (rectángulo perfecto, no trapecio distorsionado)
      expect(Math.abs(baseWidth - topWidth)).toBeLessThan(0.05);

      // 2. Las aristas laterales de extrusión deben tener exactamente la altura especificada
      const leftHeight = haversineDistance(
        { longitude: pStart[0], latitude: pStart[1] },
        { longitude: qStart[0], latitude: qStart[1] }
      );
      const rightHeight = haversineDistance(
        { longitude: pEnd[0], latitude: pEnd[1] },
        { longitude: qEnd[0], latitude: qEnd[1] }
      );

      expect(Math.abs(leftHeight - rightHeight)).toBeLessThan(0.05);
      expect(leftHeight).toBeCloseTo(bar.heightMeters, 0);
    }
  });

  it('debe cumplir con Test Case 31.3: Isolíneas de escala rectas y estrictamente paralelas a la línea base', () => {
    const results = analyzeLrs(bypassAlignment, []);
    const profile = generateCurvilinearProfile(bypassAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      heightScaleMetersPerUnit: 40,
      scaleTicks: [12, 24, 36, 48],
      baselineMode: 'RECTILINEAR',
      borderCurvatureRatio: 0
    });

    expect(profile.isolines).toHaveLength(4);

    for (const iso of profile.isolines) {
      const coords = iso.lineCoordinates;
      expect(coords.length).toBeGreaterThan(5);

      const iFirst = coords[0];
      const iLast = coords[coords.length - 1];
      const totalIsoLen = haversineDistance(
        { longitude: iFirst[0], latitude: iFirst[1] },
        { longitude: iLast[0], latitude: iLast[1] }
      );

      // Cada isolínea debe ser colineal (recta pura)
      for (let j = 1; j < coords.length - 1; j++) {
        const d1 = haversineDistance(
          { longitude: iFirst[0], latitude: iFirst[1] },
          { longitude: coords[j][0], latitude: coords[j][1] }
        );
        const d2 = haversineDistance(
          { longitude: coords[j][0], latitude: coords[j][1] },
          { longitude: iLast[0], latitude: iLast[1] }
        );
        expect(Math.abs(d1 + d2 - totalIsoLen)).toBeLessThan(0.05);
      }

      // La distancia entre la baseline y la isolínea debe ser constante en inicio, medio y fin
      const midIdx = Math.floor(coords.length / 2);
      const bFirst = profile.baselineCoordinates[0];
      const bMid = profile.baselineCoordinates[midIdx];
      const bLast = profile.baselineCoordinates[profile.baselineCoordinates.length - 1];

      const distStart = haversineDistance({ longitude: bFirst[0], latitude: bFirst[1] }, { longitude: iFirst[0], latitude: iFirst[1] });
      const distMid = haversineDistance({ longitude: bMid[0], latitude: bMid[1] }, { longitude: coords[midIdx][0], latitude: coords[midIdx][1] });
      const distEnd = haversineDistance({ longitude: bLast[0], latitude: bLast[1] }, { longitude: iLast[0], latitude: iLast[1] });

      expect(Math.abs(distStart - distMid)).toBeLessThan(0.1);
      expect(Math.abs(distMid - distEnd)).toBeLessThan(0.1);
      expect(distStart).toBeCloseTo(iso.heightMeters, 0);
    }
  });

  it('debe cumplir con Test Case 31.4: Puntero interactivo sobre la línea base rectilínea con línea conectora al trazo vial', () => {
    const results = analyzeLrs(bypassAlignment, []);
    const profile = generateCurvilinearProfile(bypassAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      baselineMode: 'RECTILINEAR'
    });

    const s = 1500; // En la zona del bypass curvo
    const pointerGeom = computePointerGeometry(
      bypassAlignment,
      s,
      offsetDist,
      'RIGHT',
      3,
      profile.baselineProfile
    );

    expect(pointerGeom.chainageMeters).toBe(1500);
    expect(pointerGeom.connectorLineCoordinates).toHaveLength(2);

    const roadPt = pointerGeom.connectorLineCoordinates[0];
    const basePt = pointerGeom.connectorLineCoordinates[1];

    expect(roadPt).toEqual(pointerGeom.roadCoord);
    expect(basePt).toEqual(pointerGeom.baselineCoord);

    // El punto de la línea base debe estar estrictamente en la recta de la baseline
    const sampled = sampleBaselineAtStation(profile.baselineProfile!, s);
    expect(basePt).toEqual(sampled.coord);
  });

  it('debe cumplir con Test Case 31.5: Alternancia limpia entre modo RECTILINEAR y CURVED_OFFSET', () => {
    const results = analyzeLrs(bypassAlignment, []);
    const profileRect = generateCurvilinearProfile(bypassAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      baselineMode: 'RECTILINEAR'
    });

    const profileCurved = generateCurvilinearProfile(bypassAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      baselineMode: 'CURVED_OFFSET'
    });

    // En CURVED_OFFSET, la baseline sigue la curva del bypass hacia el oeste
    // En RECTILINEAR, la baseline es un vector secante recto
    const midIdx = Math.floor(profileRect.baselineCoordinates.length / 2);
    const rectMidCoord = profileRect.baselineCoordinates[midIdx];
    const curvedMidCoord = profileCurved.baselineCoordinates[midIdx];

    const midSeparation = haversineDistance(
      { longitude: rectMidCoord[0], latitude: rectMidCoord[1] },
      { longitude: curvedMidCoord[0], latitude: curvedMidCoord[1] }
    );

    // En el bypass pronunciado, ambas líneas base divergen notablemente (más de 100 metros)
    expect(midSeparation).toBeGreaterThan(100);
  });
});
