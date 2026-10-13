/**
 * Módulo de Recorte al Viewport y Segmentación Métrica Dinámica por Zoom
 * Conforme a SPEC-23 (pkg/curvilinear) - Paradigma Dinámico VisQuill GDK
 */

import { Alignment } from '../tracer/types.js';

export interface ViewportGeoBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Calcula la segmentación métrica (tamaño de bin) adecuada en función del nivel de zoom.
 * Regla normativa: El tamaño mínimo de bin es estrictamente 100 m.
 *
 * @param zoom Nivel de zoom de MapLibre (ej. 10.5 a 18.0)
 * @returns Tamaño de bin en metros (>= 100)
 */
export function computeZoomAdaptiveBinSize(zoom: number): number {
  if (zoom >= 14.5) {
    return 100; // Mínimo absoluto normativo
  }
  if (zoom >= 13.5) {
    return 200;
  }
  if (zoom >= 12.5) {
    return 500;
  }
  if (zoom >= 11.0) {
    return 1000;
  }
  return 2000;
}

/**
 * Determina si una coordenada geográfica se encuentra dentro del bounding box del viewport.
 */
function isCoordInsideBounds(lon: number, lat: number, bounds: ViewportGeoBounds): boolean {
  return (
    lon >= bounds.west &&
    lon <= bounds.east &&
    lat >= bounds.south &&
    lat <= bounds.north
  );
}

/**
 * Calcula el punto de intersección entre un segmento 2D y una recta vertical u horizontal,
 * retornando el parámetro t en [0, 1] si la intersección ocurre dentro del segmento.
 */
function intersectSegmentWithEdge(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  isVertical: boolean,
  edgeVal: number,
  minOther: number,
  maxOther: number
): number | null {
  if (isVertical) {
    const dx = x2 - x1;
    if (Math.abs(dx) < 1e-9) return null;
    const t = (edgeVal - x1) / dx;
    if (t >= 0 && t <= 1) {
      const y = y1 + t * (y2 - y1);
      if (y >= minOther && y <= maxOther) {
        return t;
      }
    }
  } else {
    const dy = y2 - y1;
    if (Math.abs(dy) < 1e-9) return null;
    const t = (edgeVal - y1) / dy;
    if (t >= 0 && t <= 1) {
      const x = x1 + t * (x2 - x1);
      if (x >= minOther && x <= maxOther) {
        return t;
      }
    }
  }
  return null;
}

/**
 * Identifica el rango de progresivas métricas [S_min, S_max] del alineamiento
 * que se encuentra dentro o visible en la pantalla actual del mapa.
 *
 * @param alignment Eje vial de referencia
 * @param bounds Límites geográficos visibles (viewport bounds)
 * @param paddingMeters Margen métrico de amortiguamiento para evitar cortes abruptos en bordes
 * @returns Rango métrico [sStart, sEnd] o null si el eje está completamente fuera de pantalla
 */
export function computeVisibleStationRange(
  alignment: Alignment,
  bounds: ViewportGeoBounds,
  paddingMeters: number = 200
): [number, number] | null {
  if (!alignment || alignment.vertices.length < 2) {
    return null;
  }

  const visibleStations: number[] = [];

  for (let i = 0; i < alignment.segments.length; i++) {
    const seg = alignment.segments[i];
    const p1 = seg.startVertex.coordinates;
    const p2 = seg.endVertex.coordinates;
    const sStart = seg.startVertex.cumulativeDistance;
    const segLen = seg.length;

    const p1In = isCoordInsideBounds(p1.longitude, p1.latitude, bounds);
    const p2In = isCoordInsideBounds(p2.longitude, p2.latitude, bounds);

    if (p1In) {
      visibleStations.push(sStart);
    }
    if (p2In) {
      visibleStations.push(seg.endVertex.cumulativeDistance);
    }

    // Evaluar intersecciones con los 4 bordes del viewport
    const edges = [
      // Borde Oeste (vertical)
      intersectSegmentWithEdge(p1.longitude, p1.latitude, p2.longitude, p2.latitude, true, bounds.west, bounds.south, bounds.north),
      // Borde Este (vertical)
      intersectSegmentWithEdge(p1.longitude, p1.latitude, p2.longitude, p2.latitude, true, bounds.east, bounds.south, bounds.north),
      // Borde Sur (horizontal)
      intersectSegmentWithEdge(p1.longitude, p1.latitude, p2.longitude, p2.latitude, false, bounds.south, bounds.west, bounds.east),
      // Borde Norte (horizontal)
      intersectSegmentWithEdge(p1.longitude, p1.latitude, p2.longitude, p2.latitude, false, bounds.north, bounds.west, bounds.east)
    ];

    for (const t of edges) {
      if (t !== null && t >= 0 && t <= 1) {
        visibleStations.push(sStart + t * segLen);
      }
    }

    // Muestreo preventivo en segmentos largos que puedan cruzar el viewport
    if (!p1In && !p2In && segLen > 400) {
      const steps = Math.ceil(segLen / 200);
      for (let step = 1; step < steps; step++) {
        const frac = step / steps;
        const midLon = p1.longitude + frac * (p2.longitude - p1.longitude);
        const midLat = p1.latitude + frac * (p2.latitude - p1.latitude);
        if (isCoordInsideBounds(midLon, midLat, bounds)) {
          visibleStations.push(sStart + frac * segLen);
        }
      }
    }
  }

  if (visibleStations.length === 0) {
    return null; // El alineamiento está fuera de la pantalla
  }

  const rawMin = Math.min(...visibleStations);
  const rawMax = Math.max(...visibleStations);

  const sMin = Math.max(0, rawMin - paddingMeters);
  const sMax = Math.min(alignment.totalLength, rawMax + paddingMeters);

  return [sMin, sMax];
}
