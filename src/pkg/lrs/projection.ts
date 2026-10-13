/**
 * Motor Matemático de Proyección Ortogonal LRS
 * Conforme a SPEC-03 (pkg/lrs)
 */

import { Alignment, AlignmentSegment, GeoCoordinate } from '../tracer/types.js';
import {
  haversineDistance,
  formatStation,
  EARTH_RADIUS_METERS,
  toRadians
} from '../tracer/geodesy.js';
import { CrashPoint, ProjectedCrash, RoadSide } from './types.js';

export interface SegmentProjection {
  segmentIndex: number;
  projectionPoint: [longitude: number, latitude: number];
  tClamped: number;
  tRaw: number;
  lateralDistanceMeters: number;
  signedLateralDistanceMeters: number;
  side: RoadSide;
  chainageMeters: number;
  isInterior: boolean;
}

/**
 * Proyecta ortogonalmente un punto geográfico 2D sobre un segmento de alineamiento individual
 * utilizando una aproximación métrica tangencial local.
 *
 * @param point Coordenadas [lon, lat] del punto a proyectar
 * @param segment Segmento vial de referencia
 * @returns Datos de la proyección sobre el segmento
 */
export function projectPointOnSegment(
  point: [longitude: number, latitude: number],
  segment: AlignmentSegment
): SegmentProjection {
  const [lonP, latP] = point;
  const lonA = segment.startVertex.coordinates.longitude;
  const latA = segment.startVertex.coordinates.latitude;
  const lonB = segment.endVertex.coordinates.longitude;
  const latB = segment.endVertex.coordinates.latitude;

  // Transformación a coordenadas cartesianas métricas locales centradas en A
  const meanLatP = toRadians((latA + latP) / 2);
  const xP = toRadians(lonP - lonA) * EARTH_RADIUS_METERS * Math.cos(meanLatP);
  const yP = toRadians(latP - latA) * EARTH_RADIUS_METERS;

  const meanLatB = toRadians((latA + latB) / 2);
  const uX = toRadians(lonB - lonA) * EARTH_RADIUS_METERS * Math.cos(meanLatB);
  const uY = toRadians(latB - latA) * EARTH_RADIUS_METERS;

  const uNormSq = uX * uX + uY * uY;

  let tRaw = 0;
  if (uNormSq > 0) {
    tRaw = (xP * uX + yP * uY) / uNormSq;
  }

  // Acotar t al rango del segmento [0, 1]
  const tClamped = Math.max(0, Math.min(1, tRaw));

  // Coordenadas WGS84 del punto proyectado P'
  const projLon = lonA + tClamped * (lonB - lonA);
  const projLat = latA + tClamped * (latB - latA);
  const projCoord: GeoCoordinate = { longitude: projLon, latitude: projLat };
  const pointCoord: GeoCoordinate = { longitude: lonP, latitude: latP };

  // Distancia lateral geodésica |D_perp|
  const lateralDistanceMeters = haversineDistance(pointCoord, projCoord);

  // Producto cruz 2D para determinar lado de calzada (sentido de circulación A -> B)
  // cross = uX * yP - uY * xP
  const cross = uX * yP - uY * xP;

  let side: RoadSide = RoadSide.CENTER;
  let signedLateralDistanceMeters = 0;

  if (lateralDistanceMeters <= 0.05) {
    side = RoadSide.CENTER;
    signedLateralDistanceMeters = 0;
  } else if (cross < 0) {
    // A la derecha del sentido de avance
    side = RoadSide.RIGHT;
    signedLateralDistanceMeters = lateralDistanceMeters;
  } else {
    // A la izquierda del sentido de avance
    side = RoadSide.LEFT;
    signedLateralDistanceMeters = -lateralDistanceMeters;
  }

  // Cadenamiento acumulado S_i
  const chainageMeters = segment.startVertex.cumulativeDistance + tClamped * segment.length;

  const isInterior = tClamped > 0.0001 && tClamped < 0.9999;

  return {
    segmentIndex: segment.index,
    projectionPoint: [projLon, projLat],
    tClamped,
    tRaw,
    lateralDistanceMeters,
    signedLateralDistanceMeters,
    side,
    chainageMeters: Math.round(chainageMeters * 100) / 100,
    isInterior
  };
}

/**
 * Proyecta un siniestro vial sobre el alineamiento completo, resolviendo
 * ambigüedades geométricas en curvas, intersecciones y vértices angostos.
 *
 * @param crash Siniestro vial con coordenadas [lon, lat]
 * @param alignment Alineamiento vial de referencia
 * @param bufferWidthMeters Ancho de buffer transversal (default: 25 m)
 * @returns Objeto ProjectedCrash completamente calculado
 */
export function projectCrashOnAlignment(
  crash: CrashPoint,
  alignment: Alignment,
  bufferWidthMeters: number = 25
): ProjectedCrash {
  if (!alignment.segments || alignment.segments.length === 0) {
    throw new Error('El alineamiento no contiene segmentos para realizar la proyección LRS.');
  }

  let bestProjection: SegmentProjection | null = null;

  for (const segment of alignment.segments) {
    const proj = projectPointOnSegment(crash.coordinates, segment);

    if (!bestProjection) {
      bestProjection = proj;
      continue;
    }

    const distDiff = Math.abs(proj.lateralDistanceMeters - bestProjection.lateralDistanceMeters);

    if (proj.lateralDistanceMeters < bestProjection.lateralDistanceMeters - 0.1) {
      // Claramente más cercano a este segmento
      bestProjection = proj;
    } else if (distDiff <= 0.1) {
      // Distancia prácticamente empatada (cerca de un vértice de unión)
      // Criterio de preferencia: favorecer la proyección perpendicular interna (0 < t < 1)
      if (proj.isInterior && !bestProjection.isInterior) {
        bestProjection = proj;
      } else if (!proj.isInterior && bestProjection.isInterior) {
        // Mantener la proyección interior existente
      } else {
        // Si ambas son del mismo tipo, desempate aguas arriba (menor índice de segmento)
        if (proj.segmentIndex < bestProjection.segmentIndex) {
          bestProjection = proj;
        }
      }
    }
  }

  if (!bestProjection) {
    throw new Error(`No se pudo calcular la proyección para el siniestro ${crash.id}`);
  }

  const isInsideBuffer = bestProjection.lateralDistanceMeters <= bufferWidthMeters;

  return {
    crash,
    segmentIndex: bestProjection.segmentIndex,
    projectionPoint: bestProjection.projectionPoint,
    chainageMeters: bestProjection.chainageMeters,
    stationFormatted: formatStation(bestProjection.chainageMeters),
    lateralDistanceMeters: Math.round(bestProjection.lateralDistanceMeters * 100) / 100,
    signedLateralDistanceMeters: Math.round(bestProjection.signedLateralDistanceMeters * 100) / 100,
    side: bestProjection.side,
    isInsideBuffer
  };
}
