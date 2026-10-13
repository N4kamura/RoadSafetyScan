/**
 * Constructor y Validador Geométrico de Alineamientos Viales
 * Conforme a SPEC-02 (pkg/tracer)
 */

import {
  GeoCoordinate,
  AlignmentVertex,
  AlignmentSegment,
  Alignment,
  BoundingBox,
  AlignmentWarning
} from './types.js';
import {
  haversineDistance,
  geodesicAzimuth,
  formatStation
} from './geodesy.js';

/** Umbral métrico para considerar dos vértices como degenerados / idénticos */
export const MIN_VERTEX_SPACING_METERS = 0.10;

/** Umbral de ángulo de deflexión para emitir advertencia de giro cerrado */
export const SHARP_DEFLECTION_THRESHOLD_DEGREES = 150;

/**
 * Determina si dos cajas delimitadoras (Bounding Boxes) 2D se solapan
 */
export function bboxesOverlap(b1: BoundingBox, b2: BoundingBox): boolean {
  return !(
    b1.maxX < b2.minX ||
    b1.minX > b2.maxX ||
    b1.maxY < b2.minY ||
    b1.minY > b2.maxY
  );
}

/**
 * Evalúa si dos segmentos de línea se intersectan en el plano 2D
 */
function segmentsIntersect(
  p1: GeoCoordinate,
  p2: GeoCoordinate,
  p3: GeoCoordinate,
  p4: GeoCoordinate
): boolean {
  function ccw(a: GeoCoordinate, b: GeoCoordinate, c: GeoCoordinate): number {
    return (c.latitude - a.latitude) * (b.longitude - a.longitude) -
           (b.latitude - a.latitude) * (c.longitude - a.longitude);
  }

  const ccw1 = ccw(p1, p3, p4);
  const ccw2 = ccw(p2, p3, p4);
  const ccw3 = ccw(p1, p2, p3);
  const ccw4 = ccw(p1, p2, p4);

  return (
    ((ccw1 > 0 && ccw2 < 0) || (ccw1 < 0 && ccw2 > 0)) &&
    ((ccw3 > 0 && ccw4 < 0) || (ccw3 < 0 && ccw4 > 0))
  );
}

/**
 * Valida, deduplica y construye un objeto Alignment a partir de coordenadas WGS84
 *
 * @param coordinates Lista ordenada de vértices geográficos
 * @param id Identificador opcional del alineamiento
 * @param name Nombre descriptivo opcional
 * @returns Instancia completa de Alignment
 */
export function createAlignment(
  coordinates: GeoCoordinate[],
  id: string = `ALIGNMENT-${Date.now()}`,
  name: string = 'Alineamiento Vial'
): Alignment {
  if (!coordinates || coordinates.length < 2) {
    throw new Error('El alineamiento requiere un mínimo de 2 coordenadas geográficas.');
  }

  const warnings: AlignmentWarning[] = [];

  // 1. Sanitizar y deduplicar vértices degenerados consecutivos (distancia < 0.10 m)
  const cleanCoordinates: GeoCoordinate[] = [coordinates[0]];
  let removedCount = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const current = coordinates[i];
    const prev = cleanCoordinates[cleanCoordinates.length - 1];
    const dist = haversineDistance(prev, current);

    if (dist < MIN_VERTEX_SPACING_METERS) {
      removedCount++;
    } else {
      cleanCoordinates.push(current);
    }
  }

  if (removedCount > 0) {
    warnings.push({
      code: 'DEGENERATE_VERTEX_REMOVED',
      message: `Se removieron ${removedCount} vértices degenerados consecutivos con espaciamiento < ${MIN_VERTEX_SPACING_METERS} m.`
    });
  }

  if (cleanCoordinates.length < 2) {
    throw new Error(
      `El alineamiento resultante tras remover duplicados contiene menos de 2 vértices válidos.`
    );
  }

  // 2. Construir vértices y calcular distancias acumuladas C_k
  let cumulativeDistance = 0;
  const vertices: AlignmentVertex[] = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < cleanCoordinates.length; i++) {
    const coord = cleanCoordinates[i];

    if (coord.longitude < minX) minX = coord.longitude;
    if (coord.longitude > maxX) maxX = coord.longitude;
    if (coord.latitude < minY) minY = coord.latitude;
    if (coord.latitude > maxY) maxY = coord.latitude;

    if (i > 0) {
      const prevCoord = cleanCoordinates[i - 1];
      const segmentDistance = haversineDistance(prevCoord, coord);
      cumulativeDistance += segmentDistance;
    }

    vertices.push({
      index: i,
      coordinates: { ...coord },
      cumulativeDistance: Math.round(cumulativeDistance * 100) / 100,
      stationFormatted: formatStation(cumulativeDistance),
      segmentAzimuth: undefined
    });
  }

  // 3. Construir segmentos y calcular azimuts
  const segments: AlignmentSegment[] = [];

  for (let i = 0; i < vertices.length - 1; i++) {
    const startVertex = vertices[i];
    const endVertex = vertices[i + 1];

    const length = haversineDistance(startVertex.coordinates, endVertex.coordinates);
    const azimuth = geodesicAzimuth(startVertex.coordinates, endVertex.coordinates);

    startVertex.segmentAzimuth = azimuth;

    const segBbox: BoundingBox = {
      minX: Math.min(startVertex.coordinates.longitude, endVertex.coordinates.longitude),
      minY: Math.min(startVertex.coordinates.latitude, endVertex.coordinates.latitude),
      maxX: Math.max(startVertex.coordinates.longitude, endVertex.coordinates.longitude),
      maxY: Math.max(startVertex.coordinates.latitude, endVertex.coordinates.latitude)
    };

    segments.push({
      index: i,
      startVertex,
      endVertex,
      length: Math.round(length * 100) / 100,
      azimuth: Math.round(azimuth * 100) / 100,
      bbox: segBbox
    });
  }

  // 4. Verificaciones de calidad geométrica (auto-intersecciones y deflexiones agudas)
  // 4.1 Auto-intersecciones entre segmentos no adyacentes
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 2; j < segments.length; j++) {
      if (bboxesOverlap(segments[i].bbox, segments[j].bbox)) {
        if (
          segmentsIntersect(
            segments[i].startVertex.coordinates,
            segments[i].endVertex.coordinates,
            segments[j].startVertex.coordinates,
            segments[j].endVertex.coordinates
          )
        ) {
          warnings.push({
            code: 'SELF_INTERSECTION_DETECTED',
            message: `Auto-intersección detectada entre el segmento ${i} (${segments[i].startVertex.stationFormatted}) y el segmento ${j} (${segments[j].startVertex.stationFormatted}).`,
            details: { segmentA: i, segmentB: j }
          });
        }
      }
    }
  }

  // 4.2 Giros o deflexiones excesivamente agudas
  for (let i = 1; i < segments.length; i++) {
    const prevAzimuth = segments[i - 1].azimuth;
    const currAzimuth = segments[i].azimuth;

    let deltaAngle = Math.abs(currAzimuth - prevAzimuth);
    if (deltaAngle > 180) {
      deltaAngle = 360 - deltaAngle;
    }

    if (deltaAngle > SHARP_DEFLECTION_THRESHOLD_DEGREES) {
      warnings.push({
        code: 'SHARP_DEFLECTION_ANGLE',
        message: `Ángulo de deflexión agudo (${deltaAngle.toFixed(1)}°) detectado en el vértice ${i} (${vertices[i].stationFormatted}).`,
        details: { vertexIndex: i, deflectionAngle: deltaAngle }
      });
    }
  }

  return {
    id,
    name,
    vertices,
    segments,
    totalLength: Math.round(cumulativeDistance * 100) / 100,
    bbox: { minX, minY, maxX, maxY },
    warnings: warnings.length > 0 ? warnings : undefined
  };
}
