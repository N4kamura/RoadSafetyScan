/**
 * Algoritmos Geodésicos de Vectores Normales y Suavizado de Curvas
 * Conforme a SPEC-06 (pkg/curvilinear)
 */

import { AlignmentVertex, AlignmentSegment, GeoCoordinate } from '../tracer/types.js';
import { EARTH_RADIUS_METERS, toRadians, toDegrees } from '../tracer/geodesy.js';

export interface UnitVector2D {
  x: number; // Componente Este (metros normalizados)
  y: number; // Componente Norte (metros normalizados)
}

/**
 * Calcula el vector normal unitario transversal a un segmento geodésico
 * (hacia la derecha según el sentido de avance start -> end)
 */
export function computeSegmentNormal(segment: AlignmentSegment): UnitVector2D {
  const p1 = segment.startVertex.coordinates;
  const p2 = segment.endVertex.coordinates;

  const meanLat = toRadians((p1.latitude + p2.latitude) / 2);
  const dx = toRadians(p2.longitude - p1.longitude) * EARTH_RADIUS_METERS * Math.cos(meanLat);
  const dy = toRadians(p2.latitude - p1.latitude) * EARTH_RADIUS_METERS;

  const len = Math.hypot(dx, dy);
  if (len === 0) {
    return { x: 1, y: 0 };
  }

  // Tangente unitaria: (dx/len, dy/len)
  // Normal hacia la derecha: (dy/len, -dx/len)
  return {
    x: dy / len,
    y: -dx / len
  };
}

/**
 * Calcula los vectores normales unitarios en cada vértice del alineamiento
 * ponderando los segmentos incidentes y aplicando suavizado móvil.
 *
 * @param vertices Lista ordenada de vértices del eje
 * @param segments Segmentos del eje
 * @param windowSize Tamaño de la ventana de suavizado (número de vecinos)
 * @returns Array de vectores normales unitarios suavizados por vértice
 */
export function computeSmoothedVertexNormals(
  vertices: AlignmentVertex[],
  segments: AlignmentSegment[],
  windowSize: number = 3
): UnitVector2D[] {
  const n = vertices.length;
  if (n === 0) return [];
  if (n === 1) return [{ x: 1, y: 0 }];

  // 1. Normales brutas por vértice (promedio de segmentos incidentes)
  const rawNormals: UnitVector2D[] = [];

  for (let i = 0; i < n; i++) {
    if (i === 0) {
      rawNormals.push(computeSegmentNormal(segments[0]));
    } else if (i === n - 1) {
      rawNormals.push(computeSegmentNormal(segments[segments.length - 1]));
    } else {
      const nPrev = computeSegmentNormal(segments[i - 1]);
      const nCurr = computeSegmentNormal(segments[i]);

      const avgX = nPrev.x + nCurr.x;
      const avgY = nPrev.y + nCurr.y;
      const len = Math.hypot(avgX, avgY);

      rawNormals.push(len > 0 ? { x: avgX / len, y: avgY / len } : nCurr);
    }
  }

  // 2. Filtro de suavizado laplaciano/gaussiano de media móvil ponderada
  const smoothedNormals: UnitVector2D[] = [];
  const radius = Math.floor(windowSize / 2);

  for (let i = 0; i < n; i++) {
    let sumX = 0;
    let sumY = 0;
    let sumWeight = 0;

    for (let offset = -radius; offset <= radius; offset++) {
      const idx = i + offset;
      if (idx >= 0 && idx < n) {
        // Ponderación triangular (peso mayor en el centro)
        const weight = radius + 1 - Math.abs(offset);
        sumX += rawNormals[idx].x * weight;
        sumY += rawNormals[idx].y * weight;
        sumWeight += weight;
      }
    }

    const normX = sumX / sumWeight;
    const normY = sumY / sumWeight;
    const len = Math.hypot(normX, normY);

    smoothedNormals.push(len > 0 ? { x: normX / len, y: normY / len } : rawNormals[i]);
  }

  return smoothedNormals;
}

/**
 * Desplaza una coordenada geográfica WGS84 una distancia métrica en la dirección de un vector normal
 *
 * @param coord Coordenada WGS84 { longitude, latitude }
 * @param normal Vector unitario en metros [x: Este, y: Norte]
 * @param distanceMeters Distancia métrica a desplazar
 * @returns Nueva coordenada [longitude, latitude]
 */
export function offsetCoordinate(
  coord: GeoCoordinate,
  normal: UnitVector2D,
  distanceMeters: number
): [number, number] {
  const latRad = toRadians(coord.latitude);

  const deltaMetersX = distanceMeters * normal.x;
  const deltaMetersY = distanceMeters * normal.y;

  const metersPerDegLat = toRadians(1) * EARTH_RADIUS_METERS;
  const metersPerDegLon = metersPerDegLat * Math.cos(latRad);

  const deltaLon = metersPerDegLon > 0 ? deltaMetersX / metersPerDegLon : 0;
  const deltaLat = deltaMetersY / metersPerDegLat;

  return [
    Number((coord.longitude + deltaLon).toFixed(6)),
    Number((coord.latitude + deltaLat).toFixed(6))
  ];
}
