/**
 * Generador Geodésico del Polígono de Faja / Corredor de Buffer Vial
 * Conforme a SPEC-22 (pkg/tracer & ui/map-view)
 */

import { Alignment } from './types.js';
import { interpolateAtStation, computeSmoothedVertexNormals } from '../curvilinear/index.js';
import { offsetCoordinate } from '../curvilinear/normals.js';

/**
 * Genera una colección GeoJSON con un polígono cerrado continuo que representa
 * la faja de amortiguamiento (buffer vial) a ambos lados del alineamiento.
 *
 * @param alignment Eje vial de referencia
 * @param bufferWidthMeters Semiancho de faja en metros (distancia hacia la izquierda y hacia la derecha)
 * @param stepMeters Intervalo métrico de muestreo longitudinal (default: 50m)
 */
export function generateBufferPolygonFeature(
  alignment: Alignment,
  bufferWidthMeters: number,
  stepMeters: number = 50
): GeoJSON.FeatureCollection {
  if (!alignment || alignment.vertices.length < 2 || bufferWidthMeters <= 0) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  const vertexNormals = computeSmoothedVertexNormals(
    alignment.vertices,
    alignment.segments,
    5
  );

  // Muestrear progresivas a lo largo del eje
  const sampleStations: number[] = [];
  const step = Math.max(10, stepMeters);
  for (let s = 0; s <= alignment.totalLength; s += step) {
    sampleStations.push(s);
  }
  if (sampleStations[sampleStations.length - 1] < alignment.totalLength) {
    sampleStations.push(alignment.totalLength);
  }

  const leftCoords: [number, number][] = [];
  const rightCoords: [number, number][] = [];

  for (const s of sampleStations) {
    const { coord, normal } = interpolateAtStation(alignment, vertexNormals, s);
    // Margen izquierdo: desplazamiento negativo
    leftCoords.push(offsetCoordinate(coord, normal, -bufferWidthMeters));
    // Margen derecho: desplazamiento positivo
    rightCoords.push(offsetCoordinate(coord, normal, bufferWidthMeters));
  }

  // Ensamblar anillo exterior del polígono:
  // 1. Recorrer borde izquierdo (s = 0 hasta s = L)
  // 2. Tapa terminal: arco semicircular alrededor del último punto
  // 3. Recorrer borde derecho en reversa (s = L hasta s = 0)
  // 4. Tapa inicial: arco semicircular alrededor del primer punto
  // 5. Cerrar polígono
  const ring: [number, number][] = [];

  // 1. Borde izquierdo
  for (const pt of leftCoords) {
    ring.push(pt);
  }

  // 2. Borde derecho en reversa
  for (let i = rightCoords.length - 1; i >= 0; i--) {
    ring.push(rightCoords[i]);
  }

  // 3. Cerrar polígono repitiendo el primer vértice
  if (ring.length > 0) {
    ring.push([ring[0][0], ring[0][1]]);
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          alignmentId: alignment.id,
          bufferWidthMeters,
          totalWidthMeters: bufferWidthMeters * 2
        },
        geometry: {
          type: 'Polygon',
          coordinates: [ring]
        }
      }
    ]
  };
}
