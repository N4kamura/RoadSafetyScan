/**
 * Motor Geométrico del Puntero Semicircular y Línea Conectora (SPEC-11)
 * y Soporte para Handle de Escala Transversal (SPEC-12)
 */

import { Alignment, GeoCoordinate } from '../tracer/types.js';
import { UnitVector2D, offsetCoordinate, computeSmoothedVertexNormals } from './normals.js';
import { interpolateAtStation } from './generator.js';
import { formatStation } from '../tracer/geodesy.js';
import { projectPointOnSegment } from '../lrs/projection.js';

export interface PointerGeometryResult {
  chainageMeters: number;
  stationFormatted: string;
  roadCoord: [number, number];       // P(s) sobre el eje vial
  baselineCoord: [number, number];   // B(s) sobre la baseline
  normalVector: UnitVector2D;
  normalAngleDegrees: number;        // Ángulo de orientación de la normal
  connectorLineCoordinates: [number, number][]; // [P(s), B(s)]
}

export function computePointerGeometry(
  alignment: Alignment,
  s: number,
  offsetDistanceMeters: number,
  side: 'LEFT' | 'RIGHT' = 'RIGHT',
  smoothingWindowSize: number = 3
): PointerGeometryResult {
  const vertexNormals = computeSmoothedVertexNormals(
    alignment.vertices,
    alignment.segments,
    smoothingWindowSize
  );

  const clampedS = Math.max(0, Math.min(alignment.totalLength, s));
  const { coord, normal } = interpolateAtStation(alignment, vertexNormals, clampedS);

  const sideSign = side === 'RIGHT' ? 1 : -1;
  const totalOffsetMeters = offsetDistanceMeters * sideSign;

  const roadCoord: [number, number] = [
    Number(coord.longitude.toFixed(6)),
    Number(coord.latitude.toFixed(6))
  ];

  const baselineCoord = offsetCoordinate(coord, normal, totalOffsetMeters);

  // Ángulo de orientación de la normal en grados
  const angleRad = Math.atan2(normal.y * sideSign, normal.x * sideSign);
  const angleDeg = (angleRad * 180) / Math.PI;

  return {
    chainageMeters: clampedS,
    stationFormatted: formatStation(clampedS),
    roadCoord,
    baselineCoord,
    normalVector: normal,
    normalAngleDegrees: angleDeg,
    connectorLineCoordinates: [roadCoord, baselineCoord]
  };
}

/**
 * Proyecta una coordenada geográfica arbitraria (ej. del cursor del mouse) sobre el alineamiento
 * para obtener el cadenamiento métrico más cercano s in [0, totalLength].
 */
export function projectPointToAlignmentChainage(
  alignment: Alignment,
  point: [number, number]
): number {
  if (!alignment.segments || alignment.segments.length === 0) return 0;

  let bestDist = Infinity;
  let bestChainage = 0;

  for (const seg of alignment.segments) {
    const proj = projectPointOnSegment(point, seg);
    if (proj.lateralDistanceMeters < bestDist) {
      bestDist = proj.lateralDistanceMeters;
      bestChainage = proj.chainageMeters;
    }
  }

  return Math.max(0, Math.min(alignment.totalLength, bestChainage));
}
