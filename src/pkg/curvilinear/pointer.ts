/**
 * Motor Geométrico del Puntero Semicircular y Línea Conectora (SPEC-11)
 * y Soporte para Handle de Escala Transversal (SPEC-12)
 */

import { Alignment, GeoCoordinate } from '../tracer/types.js';
import { UnitVector2D, offsetCoordinate, computeSmoothedVertexNormals } from './normals.js';
import { interpolateAtStation } from './generator.js';
import { formatStation, toRadians, EARTH_RADIUS_METERS } from '../tracer/geodesy.js';
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

export const MIN_HEIGHT_SCALE = 10;
export const MAX_HEIGHT_SCALE = 120;
export const SCALE_REFERENCE_VALUE = 15; // Unidades de referencia para distancia visual del handle

/**
 * Calcula la coordenada geográfica del botón rectangular de escala (SPEC-12)
 * ubicado en la grilla transversal a la misma progresiva s que el puntero.
 */
export function computeScaleHandleCoordinate(
  alignment: Alignment,
  s: number,
  offsetDistanceMeters: number,
  heightScaleMetersPerUnit: number,
  side: 'LEFT' | 'RIGHT' = 'RIGHT',
  smoothingWindowSize: number = 3
): {
  handleCoord: [number, number];
  rotationDegrees: number;
} {
  const vertexNormals = computeSmoothedVertexNormals(
    alignment.vertices,
    alignment.segments,
    smoothingWindowSize
  );

  const clampedS = Math.max(0, Math.min(alignment.totalLength, s));
  const { coord, normal } = interpolateAtStation(alignment, vertexNormals, clampedS);

  const sideSign = side === 'RIGHT' ? 1 : -1;
  const clampedScale = Math.max(MIN_HEIGHT_SCALE, Math.min(MAX_HEIGHT_SCALE, heightScaleMetersPerUnit));
  const handleDistanceAlongNormal = clampedScale * SCALE_REFERENCE_VALUE;
  const totalOffset = (offsetDistanceMeters + handleDistanceAlongNormal) * sideSign;

  const handleCoord = offsetCoordinate(coord, normal, totalOffset);
  const angleRad = Math.atan2(normal.y * sideSign, normal.x * sideSign);
  const rotationDegrees = (angleRad * 180) / Math.PI + 90;

  return {
    handleCoord,
    rotationDegrees
  };
}

/**
 * Convierte el desplazamiento transversal del cursor arrastrado en un valor de escala acotado [10, 120] m/u.
 */
export function convertDragToHeightScale(
  baselineCoord: [number, number],
  cursorCoord: [number, number],
  normalVector: UnitVector2D,
  side: 'LEFT' | 'RIGHT' = 'RIGHT'
): number {
  const sideSign = side === 'RIGHT' ? 1 : -1;
  const meanLat = toRadians((baselineCoord[1] + cursorCoord[1]) / 2);
  const dx = toRadians(cursorCoord[0] - baselineCoord[0]) * EARTH_RADIUS_METERS * Math.cos(meanLat);
  const dy = toRadians(cursorCoord[1] - baselineCoord[1]) * EARTH_RADIUS_METERS;

  // Proyección escalar sobre la normal de extrusión
  const normalX = normalVector.x * sideSign;
  const normalY = normalVector.y * sideSign;
  const projDist = dx * normalX + dy * normalY;

  // Convertir a escala
  const scale = projDist / SCALE_REFERENCE_VALUE;
  return Math.round(Math.max(MIN_HEIGHT_SCALE, Math.min(MAX_HEIGHT_SCALE, scale)));
}
