import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import {
  computePointerGeometry,
  projectPointToAlignmentChainage
} from '../../../src/pkg/curvilinear/pointer.js';
import { haversineDistance } from '../../../src/pkg/tracer/geodesy.js';

describe('Interactive Chainage Pointer & Connector Line (pkg/curvilinear) - SPEC-11 Compliance', () => {
  // Eje vial recto de 2,000 metros de Sur a Norte
  const alignment = createAlignment([
    { longitude: -77.0000, latitude: -12.0180 },
    { longitude: -77.0000, latitude: -12.0000 }
  ]);

  it('debe cumplir con Test Case 11.1: Cálculo exacto de extremos de la línea conectora P(s) y B(s)', () => {
    const s = 1000; // Punto medio del corredor
    const offsetMeters = 1200;

    const geom = computePointerGeometry(alignment, s, offsetMeters, 'RIGHT');

    expect(geom.chainageMeters).toBe(1000);
    expect(geom.stationFormatted).toBe('km 1+000.00');

    // Extremo A: P(s) en la carretera
    expect(geom.roadCoord[0]).toBeCloseTo(-77.0000, 4);

    // Extremo B: B(s) en la línea base a 1200 m hacia la derecha (Este)
    expect(geom.baselineCoord[0]).toBeGreaterThan(-77.0000);

    // La distancia geodésica entre P(s) y B(s) debe ser ~1200 metros
    const dist = haversineDistance(
      { longitude: geom.roadCoord[0], latitude: geom.roadCoord[1] },
      { longitude: geom.baselineCoord[0], latitude: geom.baselineCoord[1] }
    );
    expect(dist).toBeGreaterThanOrEqual(1180);
    expect(dist).toBeLessThanOrEqual(1220);

    // La línea conectora debe constar de 2 coordenadas [roadCoord, baselineCoord]
    expect(geom.connectorLineCoordinates).toHaveLength(2);
    expect(geom.connectorLineCoordinates[0]).toEqual(geom.roadCoord);
    expect(geom.connectorLineCoordinates[1]).toEqual(geom.baselineCoord);
  });

  it('debe cumplir con Test Case 11.2: Proyección inversa de cursor a cadenamiento vial', () => {
    // Coordenada geográfica arbitraria cercana al inicio del eje
    const pointNearStart: [number, number] = [-76.9900, -12.0160];
    const sStart = projectPointToAlignmentChainage(alignment, pointNearStart);

    expect(sStart).toBeGreaterThan(0);
    expect(sStart).toBeLessThan(1000);

    // Coordenada geográfica cercana al final del eje
    const pointNearEnd: [number, number] = [-76.9900, -12.0020];
    const sEnd = projectPointToAlignmentChainage(alignment, pointNearEnd);

    expect(sEnd).toBeGreaterThan(1500);
    expect(sEnd).toBeLessThanOrEqual(alignment.totalLength);
  });

  it('debe cumplir con Test Case 11.3: Orientación del semicírculo con su lado plano paralelo al trazo vial', () => {
    // Eje que va de Sur a Norte (rumbo 0° / 360°)
    const geomRight = computePointerGeometry(alignment, 1000, 1200, 'RIGHT');
    // Para eje Sur-Norte y side='RIGHT', la rotación calculada es 90°
    expect(geomRight.pointerRotationDegrees).toBeCloseTo(90, 1);

    const geomLeft = computePointerGeometry(alignment, 1000, 1200, 'LEFT');
    // Para side='LEFT', la rotación es -90° (270°)
    expect(geomLeft.pointerRotationDegrees).toBeCloseTo(-90, 1);
  });
});
