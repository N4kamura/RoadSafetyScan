/**
 * Motor Geométrico del Puntero Semicircular y Línea Conectora (SPEC-11, SPEC-24)
 * y Soporte para Handle de Escala Transversal (SPEC-12, SPEC-24)
 */

import { Alignment, GeoCoordinate } from '../tracer/types.js';
import { UnitVector2D, offsetCoordinate, computeSmoothedVertexNormals } from './normals.js';
import {
  interpolateAtStation,
  BaselineArcLengthProfile,
  buildBaselineArcLengthProfile,
  sampleBaselineAtArcLength,
  sampleBaselineAtStation
} from './generator.js';
import { formatStation, toRadians, EARTH_RADIUS_METERS } from '../tracer/geodesy.js';
import { projectPointOnSegment } from '../lrs/projection.js';

export interface PointerGeometryResult {
  chainageMeters: number;
  stationFormatted: string;
  roadCoord: [number, number];       // P(s) sobre el eje vial
  baselineCoord: [number, number];   // B(s) sobre la baseline
  normalVector: UnitVector2D;
  normalAngleDegrees: number;        // Ángulo de orientación de la normal (cartesian)
  pointerRotationDegrees: number;    // Rotación exacta para MapLibre para mantener el lado plano estrictamente paralelo al trazo
  connectorLineCoordinates: [number, number][]; // [P(s), B(s)]
}

export function computePointerGeometry(
  alignment: Alignment,
  s: number,
  offsetDistanceMeters: number,
  side: 'LEFT' | 'RIGHT' = 'RIGHT',
  smoothingWindowSize: number = 3,
  baselineOrCoords?: BaselineArcLengthProfile | [number, number][]
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

  let baselineCoord: [number, number];
  let normalVector: UnitVector2D;
  let angleDeg: number;
  let pointerRotationDegrees: number;

  if (baselineOrCoords) {
    const profile: BaselineArcLengthProfile = Array.isArray(baselineOrCoords)
      ? buildBaselineArcLengthProfile(baselineOrCoords, side)
      : baselineOrCoords;

    if (profile.coordinates.length >= 2 && profile.totalLength > 0) {
      // SPEC-27: Si el perfil tiene estaciones locales vinculadas, usar mapeo local estacionado
      const sampled = profile.stations && profile.stations.length >= 2
        ? sampleBaselineAtStation(profile, clampedS)
        : sampleBaselineAtArcLength(profile, (alignment.totalLength > 0 ? clampedS / alignment.totalLength : 0) * profile.totalLength);

      baselineCoord = sampled.coord;
      normalVector = sampled.normal;
      const angleRad = Math.atan2(normalVector.y, normalVector.x);
      angleDeg = (angleRad * 180) / Math.PI;
      pointerRotationDegrees = (Math.atan2(normalVector.x, normalVector.y) * 180) / Math.PI;
    } else {
      baselineCoord = offsetCoordinate(coord, normal, totalOffsetMeters);
      normalVector = { x: sideSign * normal.x, y: sideSign * normal.y };
      const angleRad = Math.atan2(normal.y * sideSign, normal.x * sideSign);
      angleDeg = (angleRad * 180) / Math.PI;
      pointerRotationDegrees = (Math.atan2(sideSign * normal.x, sideSign * normal.y) * 180) / Math.PI;
    }
  } else {
    baselineCoord = offsetCoordinate(coord, normal, totalOffsetMeters);
    normalVector = { x: sideSign * normal.x, y: sideSign * normal.y };
    const angleRad = Math.atan2(normal.y * sideSign, normal.x * sideSign);
    angleDeg = (angleRad * 180) / Math.PI;
    pointerRotationDegrees = (Math.atan2(sideSign * normal.x, sideSign * normal.y) * 180) / Math.PI;
  }

  return {
    chainageMeters: clampedS,
    stationFormatted: formatStation(clampedS),
    roadCoord,
    baselineCoord,
    normalVector,
    normalAngleDegrees: angleDeg,
    pointerRotationDegrees,
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
export const SCALE_REFERENCE_VALUE = 4.0; // Factor métrico para situar el handle exactamente sobre la grilla visual de las barras

/**
 * Calcula la coordenada geográfica del botón rectangular de escala (SPEC-12, SPEC-24, SPEC-28)
 * ubicado en la grilla transversal a la misma progresiva s que el puntero.
 * Por defecto (gridLevel = 1.0), se sitúa exactamente sobre el primer nivel de la grilla (más abajo).
 */
export function computeScaleHandleCoordinate(
  alignment: Alignment,
  s: number,
  offsetDistanceMeters: number,
  heightScaleMetersPerUnit: number,
  side: 'LEFT' | 'RIGHT' = 'RIGHT',
  smoothingWindowSize: number = 3,
  baselineOrCoords?: BaselineArcLengthProfile | [number, number][],
  gridLevel: number = 1.0,
  firstTickDistanceMeters?: number
): {
  handleCoord: [number, number];
  rotationDegrees: number;
  distanceAlongNormal: number;
  gridLevel: number;
} {
  const pointerGeom = computePointerGeometry(
    alignment,
    s,
    offsetDistanceMeters,
    side,
    smoothingWindowSize,
    baselineOrCoords
  );

  const clampedScale = Math.max(MIN_HEIGHT_SCALE, Math.min(MAX_HEIGHT_SCALE, heightScaleMetersPerUnit));
  // SPEC-28: Distancia del nivel 1 de la grilla o fallback por compatibilidad
  const baseD1 = firstTickDistanceMeters ?? (clampedScale * SCALE_REFERENCE_VALUE);
  const handleDistanceAlongNormal = gridLevel * baseD1;

  const handleCoord = offsetCoordinate(
    { longitude: pointerGeom.baselineCoord[0], latitude: pointerGeom.baselineCoord[1] },
    pointerGeom.normalVector,
    handleDistanceAlongNormal
  );

  const rotationDegrees = (Math.atan2(-pointerGeom.normalVector.x, -pointerGeom.normalVector.y) * 180) / Math.PI;

  return {
    handleCoord,
    rotationDegrees,
    distanceAlongNormal: handleDistanceAlongNormal,
    gridLevel
  };
}

/**
 * Proyecta una coordenada de cursor arrastrado estrictamente sobre el rayo transversal 1D
 * de la grilla a la progresiva s, calculando el nivel relativo de grilla y la coordenada confinada (SPEC-28).
 *
 * @param baselineCoord Origen del rayo sobre la línea base B(s)
 * @param cursorCoord Coordenada geográfica del cursor arrastrado
 * @param normalVector Vector normal unitario de extrusión de la grilla
 * @param firstTickDistanceMeters Distancia métrica de la primera isolínea (Nivel 1)
 * @returns Nivel de grilla continuo lambda, distancia acotada y coordenada geográfica confinada
 */
export function projectPointToGridRay(
  baselineCoord: [number, number],
  cursorCoord: [number, number],
  normalVector: UnitVector2D,
  firstTickDistanceMeters: number
): {
  gridLevel: number;
  clampedDistanceMeters: number;
  clampedCoord: [number, number];
} {
  const meanLat = toRadians((baselineCoord[1] + cursorCoord[1]) / 2);
  const dx = toRadians(cursorCoord[0] - baselineCoord[0]) * EARTH_RADIUS_METERS * Math.cos(meanLat);
  const dy = toRadians(cursorCoord[1] - baselineCoord[1]) * EARTH_RADIUS_METERS;

  // Proyección escalar sobre la normal exterior de la grilla
  const rawDist = dx * normalVector.x + dy * normalVector.y;

  // La grilla tiene 4 niveles, desde 0.25 hasta 4.0 veces la primera escala
  const d1 = Math.max(1, firstTickDistanceMeters);
  const minDist = 0.25 * d1;
  const maxDist = 4.0 * d1;

  const clampedDist = Math.max(minDist, Math.min(maxDist, rawDist));
  const gridLevel = Number((clampedDist / d1).toFixed(2));

  const clampedCoord = offsetCoordinate(
    { longitude: baselineCoord[0], latitude: baselineCoord[1] },
    normalVector,
    clampedDist
  );

  return {
    gridLevel,
    clampedDistanceMeters: clampedDist,
    clampedCoord
  };
}

/**
 * Convierte el desplazamiento transversal del cursor arrastrado en un valor de escala acotado [10, 120] m/u.
 */
export function convertDragToHeightScale(
  baselineCoord: [number, number],
  cursorCoord: [number, number],
  normalVector: UnitVector2D,
  side: 'LEFT' | 'RIGHT' = 'RIGHT',
  firstTickDistanceMeters?: number,
  baseScaleMetersPerUnit: number = 40
): number {
  if (firstTickDistanceMeters && firstTickDistanceMeters > 0) {
    const proj = projectPointToGridRay(baselineCoord, cursorCoord, normalVector, firstTickDistanceMeters);
    const scale = proj.gridLevel * baseScaleMetersPerUnit;
    return Math.round(Math.max(MIN_HEIGHT_SCALE, Math.min(MAX_HEIGHT_SCALE, scale)));
  }

  const sideSign = side === 'RIGHT' ? 1 : -1;
  const meanLat = toRadians((baselineCoord[1] + cursorCoord[1]) / 2);
  const dx = toRadians(cursorCoord[0] - baselineCoord[0]) * EARTH_RADIUS_METERS * Math.cos(meanLat);
  const dy = toRadians(cursorCoord[1] - baselineCoord[1]) * EARTH_RADIUS_METERS;

  // Proyección escalar sobre la normal de extrusión
  // Si normalVector ya incluye la orientación sideSign, comprobamos su producto escalar
  const projDist1 = dx * normalVector.x + dy * normalVector.y;
  const projDist2 = dx * (normalVector.x * sideSign) + dy * (normalVector.y * sideSign);
  const projDist = projDist1 > 0 ? projDist1 : (projDist2 > 0 ? projDist2 : Math.hypot(dx, dy));

  // Convertir a escala métrica acotada
  const scale = projDist / SCALE_REFERENCE_VALUE;
  return Math.round(Math.max(MIN_HEIGHT_SCALE, Math.min(MAX_HEIGHT_SCALE, scale)));
}

/**
 * Proyecta una coordenada geográfica arbitraria (ej. del mouse arrastrado) sobre la polilínea
 * de la línea base regularizada para obtener la progresiva de arco u in [0, totalLength] más cercana (SPEC-26).
 *
 * @param baseline Perfil parametrizado por longitud de arco de la línea base
 * @param point Coordenada geográfica [lon, lat]
 * @returns Posición de arco en metros, coordenada proyectada sobre la línea base y distancia lateral
 */
export function projectPointToBaselineArcLength(
  baseline: BaselineArcLengthProfile,
  point: [number, number],
  roadTotalLength?: number
): {
  arcLengthMeters: number;
  stationMeters?: number;
  projectedCoord: [number, number];
  lateralDistanceMeters: number;
} {
  const { coordinates, stations, cumulativeDistances, totalLength } = baseline;
  if (!coordinates || coordinates.length < 2 || totalLength <= 0) {
    return {
      arcLengthMeters: 0,
      stationMeters: stations ? stations[0] : 0,
      projectedCoord: coordinates[0] || point,
      lateralDistanceMeters: 0
    };
  }

  let bestDist = Infinity;
  let bestArcLength = 0;
  let bestStation: number | undefined = undefined;
  let bestCoord: [number, number] = coordinates[0];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const u1 = cumulativeDistances[i];
    const u2 = cumulativeDistances[i + 1];
    const segLen = u2 - u1;

    // Aproximación plana geodésica local para el segmento
    const meanLat = toRadians((p1[1] + p2[1]) / 2);
    const mPerDegLat = toRadians(1) * EARTH_RADIUS_METERS;
    const mPerDegLon = mPerDegLat * Math.cos(meanLat);

    const x1 = 0;
    const y1 = 0;
    const x2 = (p2[0] - p1[0]) * mPerDegLon;
    const y2 = (p2[1] - p1[1]) * mPerDegLat;

    const px = (point[0] - p1[0]) * mPerDegLon;
    const py = (point[1] - p1[1]) * mPerDegLat;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const d2 = dx * dx + dy * dy;

    let t = d2 > 0 ? (px * dx + py * dy) / d2 : 0;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const dist = Math.hypot(px - projX, py - projY);

    if (dist < bestDist) {
      bestDist = dist;
      bestArcLength = u1 + t * segLen;
      if (stations && stations.length > i + 1) {
        bestStation = stations[i] + t * (stations[i + 1] - stations[i]);
      }
      const projLon = Number((p1[0] + t * (p2[0] - p1[0])).toFixed(6));
      const projLat = Number((p1[1] + t * (p2[1] - p1[1])).toFixed(6));
      bestCoord = [projLon, projLat];
    }
  }

  const finalArcLength = Math.max(0, Math.min(totalLength, bestArcLength));
  return {
    arcLengthMeters: finalArcLength,
    stationMeters: bestStation ?? (roadTotalLength ? (finalArcLength / totalLength) * roadTotalLength : undefined),
    projectedCoord: bestCoord,
    lateralDistanceMeters: bestDist
  };
}

