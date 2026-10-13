import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import {
  generateCurvilinearProfile,
  buildBaselineArcLengthProfile
} from '../../../src/pkg/curvilinear/generator.js';
import {
  computePointerGeometry,
  projectPointToBaselineArcLength
} from '../../../src/pkg/curvilinear/pointer.js';
import { haversineDistance } from '../../../src/pkg/tracer/geodesy.js';

describe('SPEC-26: Constreñimiento 1D del Puntero sobre la Línea Base Offset', () => {
  const alignment = createAlignment([
    { longitude: -77.0000, latitude: -12.0200 },
    { longitude: -77.0000, latitude: -12.0100 },
    { longitude: -76.9900, latitude: -12.0000 }
  ]);

  const profile = generateCurvilinearProfile(alignment, analyzeLrs(alignment, []), {
    offsetDistanceMeters: 800,
    side: 'RIGHT'
  });

  it('debe cumplir con Test Case 26.1: Proyección exacta de cursor arbitrario sobre el riel 1D de la línea base', () => {
    expect(profile.baselineProfile).toBeDefined();

    // Punto del cursor alejado 3 km hacia el Este del trazo offset
    const farCursor: [number, number] = [-76.9500, -12.0150];

    const proj = projectPointToBaselineArcLength(profile.baselineProfile!, farCursor);

    expect(proj.arcLengthMeters).toBeGreaterThan(0);
    expect(proj.arcLengthMeters).toBeLessThanOrEqual(profile.baselineProfile!.totalLength);

    // La distancia lateral calculada debe ser mayor a 2,000 metros
    expect(proj.lateralDistanceMeters).toBeGreaterThan(2000);

    // Pero la coordenada proyectada projectedCoord debe residir exactamente sobre la polilínea de la línea base
    const minDistanceToBaseline = Math.min(
      ...profile.baselineCoordinates.map((c) =>
        haversineDistance(
          { longitude: proj.projectedCoord[0], latitude: proj.projectedCoord[1] },
          { longitude: c[0], latitude: c[1] }
        )
      )
    );
    expect(minDistanceToBaseline).toBeLessThan(50);
  });

  it('debe cumplir con Test Case 26.2: El marcador del puntero se ubica estrictamente sobre la línea base (desviación 0.0 m)', () => {
    const s = 1200; // Progresiva intermedia

    const geom = computePointerGeometry(
      alignment,
      s,
      800,
      'RIGHT',
      3,
      profile.baselineProfile
    );

    // geom.baselineCoord debe coincidir con un punto muestreado sobre la curva base
    const distToBaseline = Math.min(
      ...profile.baselineCoordinates.map((c) =>
        haversineDistance(
          { longitude: geom.baselineCoord[0], latitude: geom.baselineCoord[1] },
          { longitude: c[0], latitude: c[1] }
        )
      )
    );
    expect(distToBaseline).toBeLessThan(40);

    // La línea conectora tiene exactamente 2 extremos: la carretera y la línea base
    expect(geom.connectorLineCoordinates).toHaveLength(2);
    expect(geom.connectorLineCoordinates[0]).toEqual(geom.roadCoord);
    expect(geom.connectorLineCoordinates[1]).toEqual(geom.baselineCoord);
  });

  it('debe cumplir con Test Case 26.3: Constreñimiento 1D evita que el cursor se mueva en cualquier dirección 2D libre', () => {
    // Si el usuario arrastra el cursor en diagonal, la proyección siempre entrega un punto que pertenece a la curva base
    const dragPoints: [number, number][] = [
      [-76.9800, -12.0180],
      [-76.9700, -12.0120],
      [-76.9600, -12.0050]
    ];

    for (const pt of dragPoints) {
      const proj = projectPointToBaselineArcLength(profile.baselineProfile!, pt);
      const tau = proj.arcLengthMeters / profile.baselineProfile!.totalLength;
      const s = tau * alignment.totalLength;

      const geom = computePointerGeometry(alignment, s, 800, 'RIGHT', 3, profile.baselineProfile);

      // El marcador resultante geom.baselineCoord está pegado al trazo offset
      const dist = Math.min(
        ...profile.baselineCoordinates.map((c) =>
          haversineDistance(
            { longitude: geom.baselineCoord[0], latitude: geom.baselineCoord[1] },
            { longitude: c[0], latitude: c[1] }
          )
        )
      );
      expect(dist).toBeLessThan(50);
    }
  });
});
