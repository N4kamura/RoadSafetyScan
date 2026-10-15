import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import { generateCurvilinearProfile } from '../../../src/pkg/curvilinear/generator.js';
import {
  computePointerGeometry,
  computeScaleHandleCoordinate,
  projectPointToGridRay
} from '../../../src/pkg/curvilinear/pointer.js';
import { haversineDistance, toRadians, EARTH_RADIUS_METERS } from '../../../src/pkg/tracer/geodesy.js';

describe('Aligned Dual Controls & Viewport Sight Tracking - SPEC-33 Compliance', () => {
  const alignment = createAlignment([
    { longitude: -77.0000, latitude: -12.0000 },
    { longitude: -77.0000, latitude: -12.0200 },
    { longitude: -76.9900, latitude: -12.0400 } // ~4.6 km
  ]);

  const offsetDist = 500;
  const results = analyzeLrs(alignment, []);
  const profile = generateCurvilinearProfile(alignment, results, {
    offsetDistanceMeters: offsetDist,
    side: 'RIGHT'
  });

  it('debe cumplir con Test Case 33.1: Alineación coaxial estricta de ambos botones a lo largo de la normal', () => {
    // Probar en varias progresivas del alineamiento
    const testStations = [500, 1500, 2500, 3500];

    for (const s of testStations) {
      const pointerGeom = computePointerGeometry(
        alignment,
        s,
        offsetDist,
        'RIGHT',
        3,
        profile.baselineProfile
      );

      const d1 = 120; // 120 metros para primer nivel de escala
      const scaleGeom = computeScaleHandleCoordinate(
        alignment,
        s,
        offsetDist,
        40,
        'RIGHT',
        3,
        profile.baselineProfile,
        1.0,
        d1
      );

      // 1. Ambos botones deben tener orientaciones angulares paralelas (módulo 180 grados)
      const angleDiff = Math.abs(scaleGeom.rotationDegrees - pointerGeom.pointerRotationDegrees) % 180;
      expect(angleDiff < 0.01 || Math.abs(angleDiff - 180) < 0.01).toBe(true);

      // 2. El vector que une el puntero semicircular con el botón rectangular de escala debe ser colineal con normalVector
      const p1 = pointerGeom.baselineCoord;
      const p2 = scaleGeom.handleCoord;

      const meanLat = toRadians((p1[1] + p2[1]) / 2);
      const dx = toRadians(p2[0] - p1[0]) * EARTH_RADIUS_METERS * Math.cos(meanLat);
      const dy = toRadians(p2[1] - p1[1]) * EARTH_RADIUS_METERS;
      const dist = Math.hypot(dx, dy);

      expect(dist).toBeCloseTo(d1, 0);

      // Dirección unitaria calculada (dx/dist, dy/dist) debe ser idéntica a normalVector
      const ux = dx / dist;
      const uy = dy / dist;

      expect(ux).toBeCloseTo(pointerGeom.normalVector.x, 3);
      expect(uy).toBeCloseTo(pointerGeom.normalVector.y, 3);
    }
  });

  it('debe cumplir con Test Case 33.2: Seguimiento dinámico a la mira (punto medio del rango visible)', () => {
    // Simular que el usuario hace zoom/paneo a un sector de la carretera: km 1.2 a km 2.6
    const visibleRange: [number, number] = [1200, 2600];
    const sightStation = (visibleRange[0] + visibleRange[1]) / 2; // 1,900 m

    expect(sightStation).toBe(1900);

    // Al evaluar los controles en la mira, ambos se posicionan exactamente en el centro de visión
    const pointerGeom = computePointerGeometry(
      alignment,
      sightStation,
      offsetDist,
      'RIGHT',
      3,
      profile.baselineProfile
    );

    const scaleGeom = computeScaleHandleCoordinate(
      alignment,
      sightStation,
      offsetDist,
      40,
      'RIGHT',
      3,
      profile.baselineProfile,
      1.0,
      100
    );

    expect(pointerGeom.chainageMeters).toBe(1900);
    expect(scaleGeom.handleCoord).toBeDefined();
    expect(pointerGeom.baselineCoord).toBeDefined();

    // La distancia entre ambos marcadores corresponde exactamente a la escala activa
    const separation = haversineDistance(
      { longitude: pointerGeom.baselineCoord[0], latitude: pointerGeom.baselineCoord[1] },
      { longitude: scaleGeom.handleCoord[0], latitude: scaleGeom.handleCoord[1] }
    );
    expect(separation).toBeCloseTo(100, 0);
  });

  it('debe cumplir con Test Case 33.3: Confinamiento 1D y preservación de alineación durante arrastre de escala', () => {
    const s = 2000;
    const pointerGeom = computePointerGeometry(
      alignment,
      s,
      offsetDist,
      'RIGHT',
      3,
      profile.baselineProfile
    );

    const basePt = pointerGeom.baselineCoord;
    const norm = pointerGeom.normalVector;
    const d1 = 150;

    // Simular arrastre del cursor hacia una coordenada arbitraria con componente lateral y transversal
    const simulatedCursor: [number, number] = [
      basePt[0] + 0.005,
      basePt[1] + 0.003
    ];

    const proj = projectPointToGridRay(basePt, simulatedCursor, norm, d1);

    // El punto proyectado debe estar estrictamente a lo largo de la normal exterior (colineal con el puntero)
    const p1 = basePt;
    const p2 = proj.clampedCoord;
    const meanLat = toRadians((p1[1] + p2[1]) / 2);
    const dx = toRadians(p2[0] - p1[0]) * EARTH_RADIUS_METERS * Math.cos(meanLat);
    const dy = toRadians(p2[1] - p1[1]) * EARTH_RADIUS_METERS;
    const len = Math.hypot(dx, dy);

    expect(len).toBeCloseTo(proj.clampedDistanceMeters, 0);
    const ux = dx / len;
    const uy = dy / len;

    expect(ux).toBeCloseTo(norm.x, 3);
    expect(uy).toBeCloseTo(norm.y, 3);
  });
});
