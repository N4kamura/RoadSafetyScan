/**
 * Pruebas unitarias para SPEC-35:
 * Despeje Garantizado Anti-Superposición y Escalamiento Dinámico de Separación por Zoom
 */

import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import {
  generateCurvilinearProfile,
  computeZoomScaleFactor,
  sampleBaselineAtStation
} from '../../../src/pkg/curvilinear/generator.js';
import { haversineDistance } from '../../../src/pkg/tracer/geodesy.js';

describe('SPEC-35: Anti-Overlap Clearance & Zoom-Adaptive Offset', () => {
  // Trazo vial con un fuerte abombamiento lateral en "C" de ~2.5 km hacia el Este (RIGHT)
  // emulando el tramo de Evitamiento / Panamericana Sur que se abre hacia Santa Anita
  const curvedAlignment = createAlignment([
    { longitude: -77.0200, latitude: -12.0000 }, // Inicio: s=0
    { longitude: -76.9900, latitude: -12.0400 }, // Arco exterior este (+2.5 km respecto a la secante)
    { longitude: -76.9800, latitude: -12.0800 }, // Cúspide del abombamiento
    { longitude: -77.0000, latitude: -12.1200 }, // Retorno hacia el oeste
    { longitude: -77.0300, latitude: -12.1600 }  // Fin del tramo
  ]);

  it('debe cumplir con Test Case 35.1: Garantía anti-superposición ante abombamiento vial pronunciado', () => {
    const results = analyzeLrs(curvedAlignment, []);
    const requestedOffset = 800; // Offset nominal configurado por el usuario

    const profile = generateCurvilinearProfile(curvedAlignment, results, {
      offsetDistanceMeters: requestedOffset,
      side: 'RIGHT',
      baselineMode: 'RECTILINEAR'
    });

    expect(profile.baselineProfile).toBeDefined();
    const bp = profile.baselineProfile!;
    expect(bp.coordinates.length).toBeGreaterThan(10);

    // Para cada vértice de la carretera, verificar que la línea base queda desplazada
    // estrictamente más allá del eje vial en la dirección outwardNormal
    // Verificamos que ningún punto de la línea base cruza o intersecta la carretera
    for (const v of curvedAlignment.vertices) {
      // Buscar la distancia mínima de este vértice a cualquier punto de la línea base
      let minDistToBaseline = Infinity;
      for (const coord of bp.coordinates) {
        const d = haversineDistance(
          v.coordinates,
          { longitude: coord[0], latitude: coord[1] }
        );
        if (d < minDistToBaseline) {
          minDistToBaseline = d;
        }
      }
      // La distancia mínima debe ser de al menos varios cientos de metros
      // (sin superposición en ningún punto del corredor)
      expect(minDistToBaseline).toBeGreaterThan(200);
    }
  });

  it('debe cumplir con Test Case 35.2: Escalamiento adaptativo según el zoom del visor', () => {
    // Zoom cercano (zoom >= 13): No debe alterar el offset nominal del usuario
    expect(computeZoomScaleFactor(13.0, 13.0, 0.70, 5.0)).toBe(1.0);
    expect(computeZoomScaleFactor(14.0, 13.0, 0.70, 5.0)).toBe(1.0);
    expect(computeZoomScaleFactor(16.0, 13.0, 0.70, 5.0)).toBe(1.0);

    // Zoom medio y lejano (zoom < 13): Debe aumentar suavemente el factor
    const factor12 = computeZoomScaleFactor(12.0, 13.0, 0.70, 5.0);
    const factor11 = computeZoomScaleFactor(11.0, 13.0, 0.70, 5.0);
    const factor9 = computeZoomScaleFactor(9.0, 13.0, 0.70, 5.0);
    const factor6 = computeZoomScaleFactor(6.0, 13.0, 0.70, 5.0);

    expect(factor12).toBeGreaterThan(1.0);
    expect(factor11).toBeGreaterThan(factor12);
    expect(factor9).toBeGreaterThan(factor11);

    // No debe superar la cota superior maxFactor (5.0)
    expect(factor6).toBeLessThanOrEqual(5.0);

    // A zoom 10, con offset nominal de 1200m, el offset adaptativo debe superar los 2500m
    const nominalOffset = 1200;
    const factor10 = computeZoomScaleFactor(10.0, 13.0, 0.70, 5.0);
    const effectiveOffset = nominalOffset * factor10;
    expect(effectiveOffset).toBeGreaterThan(2500);
  });

  it('debe cumplir con Test Case 35.3: Bordes curvos terminales mantienen despeje seguro sin invadir la carretera', () => {
    const results = analyzeLrs(curvedAlignment, []);
    const requestedOffset = 1000;

    const profile = generateCurvilinearProfile(curvedAlignment, results, {
      offsetDistanceMeters: requestedOffset,
      side: 'RIGHT',
      borderCurvatureRatio: 0.15
    });

    const bp = profile.baselineProfile!;
    const startCoord = bp.coordinates[0];
    const endCoord = bp.coordinates[bp.coordinates.length - 1];

    const firstRoadVertex = curvedAlignment.vertices[0];
    const lastRoadVertex = curvedAlignment.vertices[curvedAlignment.vertices.length - 1];

    const dStart = haversineDistance(
      firstRoadVertex.coordinates,
      { longitude: startCoord[0], latitude: startCoord[1] }
    );

    const dEnd = haversineDistance(
      lastRoadVertex.coordinates,
      { longitude: endCoord[0], latitude: endCoord[1] }
    );

    // En los extremos curvos, la distancia a los extremos de la carretera
    // debe ser segura y positiva (> 500m)
    expect(dStart).toBeGreaterThan(500);
    expect(dEnd).toBeGreaterThan(500);
  });
});
