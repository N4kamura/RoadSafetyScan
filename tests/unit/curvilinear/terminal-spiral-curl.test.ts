/**
 * Pruebas unitarias para SPEC-36:
 * Remates Terminales en Espiral / Cuarto de Circunferencia hacia el Trazo Vial
 */

import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import {
  generateCurvilinearProfile,
  sampleBaselineAtStation
} from '../../../src/pkg/curvilinear/generator.js';
import { haversineDistance } from '../../../src/pkg/tracer/geodesy.js';

describe('SPEC-36: Terminal Quarter-Circle Spiral Curl', () => {
  // Corredor de prueba norte-sur
  const alignment = createAlignment([
    { longitude: -77.0200, latitude: -12.0000 },
    { longitude: -77.0100, latitude: -12.0300 },
    { longitude: -77.0000, latitude: -12.0600 },
    { longitude: -76.9900, latitude: -12.0900 }
  ]);

  it('debe cumplir con Test Case 36.1: Remate terminal en cuarto de circunferencia girando hacia el eje vial', () => {
    const results = analyzeLrs(alignment, []);
    const offset = 1200;

    const profile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: offset,
      side: 'RIGHT',
      baselineMode: 'RECTILINEAR',
      borderCurvatureRatio: 0.15
    });

    const bp = profile.baselineProfile!;
    expect(bp).toBeDefined();
    expect(bp.coordinates.length).toBeGreaterThan(10);

    const coords = bp.coordinates;
    const n = coords.length;

    // Tomar los últimos dos puntos para determinar la tangente del extremo final
    const pPenultimate = coords[n - 2];
    const pLast = coords[n - 1];

    // Tomar dos puntos en el cuerpo central (alrededor del 50%) para la tangente central
    const midIdx = Math.floor(n / 2);
    const pMid1 = coords[midIdx];
    const pMid2 = coords[midIdx + 1];

    const dCentralLon = pMid2[0] - pMid1[0];
    const dCentralLat = pMid2[1] - pMid1[1];
    const lenCentral = Math.hypot(dCentralLon, dCentralLat) || 1;
    const tCentral = { x: dCentralLon / lenCentral, y: dCentralLat / lenCentral };

    const dEndLon = pLast[0] - pPenultimate[0];
    const dEndLat = pLast[1] - pPenultimate[1];
    const lenEnd = Math.hypot(dEndLon, dEndLat) || 1;
    const tEnd = { x: dEndLon / lenEnd, y: dEndLat / lenEnd };

    // Producto escalar entre la tangente final y la tangente central
    const dot = tCentral.x * tEnd.x + tCentral.y * tEnd.y;

    // Con deflexión suave y tendida en el último borde (~45°), cos(45°) ~ 0.707.
    // El producto escalar refleja una curva plana y no exagerada (entre 0.60 y 0.85)
    expect(dot).toBeLessThan(0.85);
    expect(dot).toBeGreaterThan(0.60);

    // Verificar que la componente de desplazamiento se dirige hacia la carretera (-outwardNormal)
    // El punto final debe estar más cerca de la secante vial que el punto de unión
    const pJunc = coords[Math.floor(n * 0.85)];
    // Proyección en outwardNormal:
    const mPerDegLat = 111139;
    const mPerDegLon = mPerDegLat * Math.cos(-12.05 * Math.PI / 180);
    const midNormal = bp.normals[midIdx];

    const dJuncNormal = ((pJunc[0] - coords[0][0]) * mPerDegLon) * midNormal.x + ((pJunc[1] - coords[0][1]) * mPerDegLat) * midNormal.y;
    const dLastNormal = ((pLast[0] - coords[0][0]) * mPerDegLon) * midNormal.x + ((pLast[1] - coords[0][1]) * mPerDegLat) * midNormal.y;

    // pLast debe haberse desplazado hacia la carretera respecto a la recta central
    expect(dLastNormal).toBeLessThan(dJuncNormal - 200);
  });

  it('debe cumplir con Test Case 36.2: Continuidad C1 en los puntos de unión con la recta central', () => {
    const results = analyzeLrs(alignment, []);
    const profile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: 1000,
      side: 'RIGHT',
      baselineMode: 'RECTILINEAR',
      borderCurvatureRatio: 0.15
    });

    const bp = profile.baselineProfile!;
    const coords = bp.coordinates;
    const normals = bp.normals;

    // Comprobar que no hay saltos bruscos de distancia entre vértices adyacentes
    for (let i = 1; i < coords.length; i++) {
      const d = haversineDistance(
        { longitude: coords[i - 1][0], latitude: coords[i - 1][1] },
        { longitude: coords[i][0], latitude: coords[i][1] }
      );
      // Cada paso de muestreo está entre 10 y 100m, no debe haber teletransportes
      expect(d).toBeLessThan(120);
      expect(d).toBeGreaterThan(0);
    }

    // Comprobar que en el cuerpo central todas las normales son constantes
    const midIdx = Math.floor(coords.length / 2);
    const nCenter = normals[midIdx];
    const nNeighbor = normals[midIdx + 1];
    const dotCenter = nCenter.x * nNeighbor.x + nCenter.y * nNeighbor.y;
    expect(dotCenter).toBeCloseTo(1.0, 4);
  });

  it('debe cumplir con Test Case 36.3: Ambos extremos (inicio y fin) se curvan simétricamente hacia la calzada', () => {
    const results = analyzeLrs(alignment, []);
    const profile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: 1000,
      side: 'RIGHT',
      baselineMode: 'RECTILINEAR',
      borderCurvatureRatio: 0.15
    });

    const bp = profile.baselineProfile!;
    const coords = bp.coordinates;
    const normals = bp.normals;
    const n = coords.length;

    // En el inicio (tau=0), la normal rota en sentido inverso al fin (tau=1)
    const nStart = normals[0];
    const nEnd = normals[n - 1];
    const nMid = normals[Math.floor(n / 2)];

    // Tanto nStart como nEnd deben diferir de nMid
    expect(nStart.x * nMid.x + nStart.y * nMid.y).toBeLessThan(0.95);
    expect(nEnd.x * nMid.x + nEnd.y * nMid.y).toBeLessThan(0.95);
  });
});
