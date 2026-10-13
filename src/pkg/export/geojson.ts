/**
 * Generador de Archivos GeoJSON (RFC 7946) para Resultados LRS
 * Conforme a SPEC-05 (pkg/export)
 */

import { Alignment } from '../tracer/types.js';
import { LrsAnalysisResult, ProjectedCrash } from '../lrs/types.js';

export interface GeoJsonFeature<G = any, P = any> {
  type: 'Feature';
  geometry: G;
  properties: P;
}

export interface GeoJsonFeatureCollection<G = any, P = any> {
  type: 'FeatureCollection';
  name?: string;
  features: GeoJsonFeature<G, P>[];
}

/**
 * Extrae una sub-polilínea de coordenadas entre dos distancias de cadenamiento acumuladas
 */
export function extractSubLineString(
  alignment: Alignment,
  startMeters: number,
  endMeters: number
): [number, number][] {
  const coords: [number, number][] = [];

  for (const seg of alignment.segments) {
    const segStart = seg.startVertex.cumulativeDistance;
    const segEnd = seg.endVertex.cumulativeDistance;

    // Segmento fuera del rango
    if (segEnd < startMeters || segStart > endMeters) {
      continue;
    }

    // Punto inicial dentro de este segmento
    if (startMeters >= segStart && startMeters <= segEnd) {
      const t = seg.length > 0 ? (startMeters - segStart) / seg.length : 0;
      const lon = seg.startVertex.coordinates.longitude + t * (seg.endVertex.coordinates.longitude - seg.startVertex.coordinates.longitude);
      const lat = seg.startVertex.coordinates.latitude + t * (seg.endVertex.coordinates.latitude - seg.startVertex.coordinates.latitude);
      coords.push([Number(lon.toFixed(6)), Number(lat.toFixed(6))]);
    }

    // Vértice intermedio
    if (seg.endVertex.cumulativeDistance > startMeters && seg.endVertex.cumulativeDistance < endMeters) {
      coords.push([
        Number(seg.endVertex.coordinates.longitude.toFixed(6)),
        Number(seg.endVertex.coordinates.latitude.toFixed(6))
      ]);
    }

    // Punto final dentro de este segmento
    if (endMeters >= segStart && endMeters <= segEnd) {
      const t = seg.length > 0 ? (endMeters - segStart) / seg.length : 0;
      const lon = seg.startVertex.coordinates.longitude + t * (seg.endVertex.coordinates.longitude - seg.startVertex.coordinates.longitude);
      const lat = seg.startVertex.coordinates.latitude + t * (seg.endVertex.coordinates.latitude - seg.startVertex.coordinates.latitude);
      coords.push([Number(lon.toFixed(6)), Number(lat.toFixed(6))]);
    }
  }

  // Si por redondeo tiene menos de 2 puntos, garantizar al menos 2
  if (coords.length < 2 && alignment.vertices.length >= 2) {
    coords.push([
      Number(alignment.vertices[0].coordinates.longitude.toFixed(6)),
      Number(alignment.vertices[0].coordinates.latitude.toFixed(6))
    ]);
    coords.push([
      Number(alignment.vertices[alignment.vertices.length - 1].coordinates.longitude.toFixed(6)),
      Number(alignment.vertices[alignment.vertices.length - 1].coordinates.latitude.toFixed(6))
    ]);
  }

  return coords;
}

/**
 * Genera la capa GeoJSON de siniestros viales referenciados con atributos LRS
 *
 * @param results Resultado del análisis LRS
 * @returns FeatureCollection GeoJSON RFC 7946
 */
export function generateProjectedCrashesGeoJson(
  results: LrsAnalysisResult
): GeoJsonFeatureCollection {
  const features: GeoJsonFeature[] = results.projectedCrashes.map((proj) => {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [proj.crash.coordinates[0], proj.crash.coordinates[1]]
      },
      properties: {
        crash_id: proj.crash.id,
        chainage_meters: proj.chainageMeters,
        station_formatted: proj.stationFormatted,
        lateral_distance_m: proj.lateralDistanceMeters,
        signed_lateral_distance_m: proj.signedLateralDistanceMeters,
        road_side: proj.side,
        is_inside_buffer: proj.isInsideBuffer,
        severity: proj.crash.severity,
        crash_type: proj.crash.type,
        timestamp: proj.crash.timestamp,
        year: proj.crash.year,
        road_code: proj.crash.roadCode,
        projected_coordinates: proj.projectionPoint
      }
    };
  });

  return {
    type: 'FeatureCollection',
    name: 'RoadSafetyScan_ProjectedCrashes',
    features
  };
}

/**
 * Determina la categoría de riesgo cualitativo según el puntaje EPDO
 */
export function getRiskLevel(epdoScore: number): 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO' {
  if (epdoScore >= 30) return 'CRITICO';
  if (epdoScore >= 15) return 'ALTO';
  if (epdoScore >= 5) return 'MEDIO';
  return 'BAJO';
}

/**
 * Genera la capa GeoJSON de tramos lineales homogéneos del corredor
 * para visualización temática en SIG (QGIS, ArcGIS).
 *
 * @param alignment Eje vial de referencia
 * @param results Resultado del análisis LRS
 * @returns FeatureCollection de geometrías LineString con indicadores agregados
 */
export function generateCorridorBinsGeoJson(
  alignment: Alignment,
  results: LrsAnalysisResult
): GeoJsonFeatureCollection {
  const features: GeoJsonFeature[] = results.bins.map((bin) => {
    const lineCoords = extractSubLineString(
      alignment,
      bin.startChainageMeters,
      bin.endChainageMeters
    );

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: lineCoords
      },
      properties: {
        bin_index: bin.binIndex,
        prog_inicio_m: bin.startChainageMeters,
        prog_fin_m: bin.endChainageMeters,
        station_start: bin.startStationFormatted,
        station_end: bin.endStationFormatted,
        total_crashes: bin.totalCount,
        fatal_count: bin.severityCounts['FATAL'] || 0,
        grave_count: bin.severityCounts['LESIONES_GRAVES'] || 0,
        leve_count: bin.severityCounts['LESIONES_LEVES'] || 0,
        danos_count: bin.severityCounts['SOLO_DANOS'] || 0,
        epdo_score: bin.epdoScore,
        density_per_km: bin.densityPerKm,
        risk_level: getRiskLevel(bin.epdoScore)
      }
    };
  });

  return {
    type: 'FeatureCollection',
    name: 'RoadSafetyScan_CorridorSegments',
    features
  };
}
