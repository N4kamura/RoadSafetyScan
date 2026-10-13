/**
 * Generador Geométrico del Perfil Curvilíneo ("Profiles along a line")
 * Conforme a SPEC-06 (pkg/curvilinear) - Paradigma VisQuill GDK A1 Collision Density
 */

import { Alignment, GeoCoordinate } from '../tracer/types.js';
import { LrsAnalysisResult, SeverityLevel } from '../lrs/types.js';
import {
  computeSmoothedVertexNormals,
  offsetCoordinate,
  UnitVector2D
} from './normals.js';
import {
  CurvilinearProfileOptions,
  CurvilinearBarFeature,
  CurvilinearIsolineFeature,
  CurvilinearProfileModel
} from './types.js';

export const DEFAULT_CURVILINEAR_OPTIONS: CurvilinearProfileOptions = {
  offsetDistanceMeters: 1200, // 1.2 km de separación lateral por defecto
  side: 'RIGHT',
  heightScaleMetersPerUnit: 40, // 40 metros de altura visual por unidad de valor
  scaleTicks: [10, 20, 30, 40],
  smoothingWindowSize: 3
};

/**
 * Calcula un factor multiplicador de escala adaptativo cuando el usuario aleja el zoom
 * Conforme a SPEC-09
 *
 * @param zoom Nivel de zoom actual del mapa
 * @param refZoom Zoom de referencia donde el factor es 1.0 (default: 13.0)
 * @param gamma Exponente de atenuación (default: 0.70)
 * @param maxFactor Límite superior de seguridad (default: 4.5)
 */
export function computeZoomScaleFactor(
  zoom: number,
  refZoom: number = 13.0,
  gamma: number = 0.70,
  maxFactor: number = 4.5
): number {
  if (zoom >= refZoom) {
    return 1.0;
  }
  const delta = refZoom - zoom;
  const factor = Math.pow(2, delta * gamma);
  return Math.min(maxFactor, Math.max(1.0, factor));
}

/**
 * Interpola una coordenada geográfica y su vector normal para una progresiva métrica s
 */
function interpolateAtStation(
  alignment: Alignment,
  vertexNormals: UnitVector2D[],
  s: number
): { coord: GeoCoordinate; normal: UnitVector2D } {
  const totalLength = alignment.totalLength;
  const clampedS = Math.max(0, Math.min(totalLength, s));

  // Localizar el segmento correspondiente
  for (let i = 0; i < alignment.segments.length; i++) {
    const seg = alignment.segments[i];
    const sStart = seg.startVertex.cumulativeDistance;
    const sEnd = seg.endVertex.cumulativeDistance;

    if (clampedS >= sStart && (clampedS <= sEnd || i === alignment.segments.length - 1)) {
      const frac = seg.length > 0 ? (clampedS - sStart) / seg.length : 0;
      const t = Math.max(0, Math.min(1, frac));

      // Coordenada interpolada
      const lon = seg.startVertex.coordinates.longitude + t * (seg.endVertex.coordinates.longitude - seg.startVertex.coordinates.longitude);
      const lat = seg.startVertex.coordinates.latitude + t * (seg.endVertex.coordinates.latitude - seg.startVertex.coordinates.latitude);

      // Normal interpolada entre los dos vértices
      const n1 = vertexNormals[i];
      const n2 = vertexNormals[i + 1] || n1;

      const normX = n1.x + t * (n2.x - n1.x);
      const normY = n1.y + t * (n2.y - n1.y);
      const len = Math.hypot(normX, normY) || 1;

      return {
        coord: { longitude: lon, latitude: lat },
        normal: { x: normX / len, y: normY / len }
      };
    }
  }

  // Fallback
  const lastVertex = alignment.vertices[alignment.vertices.length - 1];
  return {
    coord: lastVertex.coordinates,
    normal: vertexNormals[vertexNormals.length - 1] || { x: 1, y: 0 }
  };
}

/**
 * Genera el modelo geométrico completo del perfil curvilíneo paralelo al trazo
 *
 * @param alignment Eje vial de referencia
 * @param results Resultados del análisis LRS con bins
 * @param options Opciones de configuración geométrica
 * @returns Modelo con baseline, barras poligonales e isolíneas curvas
 */
export function generateCurvilinearProfile(
  alignment: Alignment,
  results: LrsAnalysisResult,
  options?: Partial<CurvilinearProfileOptions>
): CurvilinearProfileModel {
  const opts: CurvilinearProfileOptions = {
    ...DEFAULT_CURVILINEAR_OPTIONS,
    ...options
  };

  const vertexNormals = computeSmoothedVertexNormals(
    alignment.vertices,
    alignment.segments,
    opts.smoothingWindowSize
  );

  // Multiplicador de signo según lado: +1 si RIGHT, -1 si LEFT
  const sideSign = opts.side === 'RIGHT' ? 1 : -1;
  const baseOffsetMeters = opts.offsetDistanceMeters * sideSign;

  // 1. Generar la Línea Base Desplazada B(s)
  // Muestrear a lo largo del eje cada bin boundary y vértice
  const sampleStations: number[] = [];
  const binStep = results.bins.length > 0 ? (results.bins[0].endChainageMeters - results.bins[0].startChainageMeters) : 100;

  for (let s = 0; s <= alignment.totalLength; s += binStep) {
    sampleStations.push(s);
  }
  if (sampleStations[sampleStations.length - 1] < alignment.totalLength) {
    sampleStations.push(alignment.totalLength);
  }

  const baselineCoordinates: [number, number][] = sampleStations.map((s) => {
    const { coord, normal } = interpolateAtStation(alignment, vertexNormals, s);
    return offsetCoordinate(coord, normal, baseOffsetMeters);
  });

  // 2. Generar Barras Poligonales Extruidas Ortogonalmente
  const bars: CurvilinearBarFeature[] = [];

  for (const bin of results.bins) {
    const sStart = bin.startChainageMeters;
    const sEnd = bin.endChainageMeters;

    const startInterp = interpolateAtStation(alignment, vertexNormals, sStart);
    const endInterp = interpolateAtStation(alignment, vertexNormals, sEnd);

    // Puntos de anclaje sobre la baseline B(s)
    const pStart = offsetCoordinate(startInterp.coord, startInterp.normal, baseOffsetMeters);
    const pEnd = offsetCoordinate(endInterp.coord, endInterp.normal, baseOffsetMeters);

    // Altura proporcional a la métrica seleccionada
    let value = bin.totalCount;
    if (opts.metricMode === 'EPDO') {
      value = bin.epdoScore;
    } else if (opts.metricMode === 'DENSITY_KM') {
      value = bin.densityPerKm;
    }
    const barHeightMeters = value * opts.heightScaleMetersPerUnit;
    const totalExtrusionMeters = baseOffsetMeters + (barHeightMeters * sideSign);

    // Puntos del borde exterior extruido
    const qStart = offsetCoordinate(startInterp.coord, startInterp.normal, totalExtrusionMeters);
    const qEnd = offsetCoordinate(endInterp.coord, endInterp.normal, totalExtrusionMeters);

    // Polígono cerrado del cuadrilátero [P_start, Q_start, Q_end, P_end, P_start]
    const polygonCoordinates: [number, number][] = [
      pStart,
      qStart,
      qEnd,
      pEnd,
      pStart
    ];

    bars.push({
      binIndex: bin.binIndex,
      startChainageMeters: sStart,
      endChainageMeters: sEnd,
      startStationFormatted: bin.startStationFormatted,
      endStationFormatted: bin.endStationFormatted,
      value,
      heightMeters: barHeightMeters,
      polygonCoordinates,
      severityBreakdown: {
        fatal: bin.severityCounts[SeverityLevel.FATAL] || 0,
        grave: bin.severityCounts[SeverityLevel.LESIONES_GRAVES] || 0,
        leve: bin.severityCounts[SeverityLevel.LESIONES_LEVES] || 0,
        danos: bin.severityCounts[SeverityLevel.SOLO_DANOS] || 0
      }
    });
  }

  // 3. Generar Isolíneas Concéntricas de Escala Curvilíneas
  let activeTicks = opts.scaleTicks;
  if (!options?.scaleTicks && results.bins.length > 0) {
    const maxVal = results.bins.reduce((max, b) => {
      const v = opts.metricMode === 'EPDO' ? b.epdoScore : opts.metricMode === 'DENSITY_KM' ? b.densityPerKm : b.totalCount;
      return Math.max(max, v);
    }, 0);

    if (maxVal > 0) {
      const ceiling = Math.ceil(maxVal * 1.15);
      const step = ceiling <= 10 ? 2 : ceiling <= 25 ? 5 : ceiling <= 60 ? 10 : ceiling <= 150 ? 25 : 50;
      activeTicks = [];
      for (let t = step; t <= ceiling; t += step) {
        activeTicks.push(t);
      }
      if (activeTicks.length === 0) activeTicks = [step];
    } else {
      activeTicks = [5, 10];
    }
  }

  const isolines: CurvilinearIsolineFeature[] = [];

  for (const tickVal of activeTicks) {
    const tickHeightMeters = tickVal * opts.heightScaleMetersPerUnit;
    const tickTotalOffset = baseOffsetMeters + (tickHeightMeters * sideSign);

    const lineCoordinates: [number, number][] = sampleStations.map((s) => {
      const { coord, normal } = interpolateAtStation(alignment, vertexNormals, s);
      return offsetCoordinate(coord, normal, tickTotalOffset);
    });

    // Posición de la etiqueta: en el punto medio de la isolínea
    const midIdx = Math.floor(lineCoordinates.length / 2);
    const labelPos = lineCoordinates[midIdx] || lineCoordinates[0];

    isolines.push({
      tickValue: tickVal,
      heightMeters: tickHeightMeters,
      lineCoordinates,
      labelPosition: labelPos,
      labelRotationDegrees: 0
    });
  }

  // 4. Rayos conectores transversales en los extremos (km 0 y final)
  const connectorLines: [number, number][][] = [];
  const maxTick = activeTicks.length > 0 ? Math.max(...activeTicks, 10) : 10;
  const maxExtrusionMeters = baseOffsetMeters + (maxTick * opts.heightScaleMetersPerUnit * sideSign);

  // Conector inicial (s = 0)
  const startAtZero = interpolateAtStation(alignment, vertexNormals, 0);
  connectorLines.push([
    offsetCoordinate(startAtZero.coord, startAtZero.normal, baseOffsetMeters),
    offsetCoordinate(startAtZero.coord, startAtZero.normal, maxExtrusionMeters)
  ]);

  // Conector final (s = totalLength)
  const endAtTotal = interpolateAtStation(alignment, vertexNormals, alignment.totalLength);
  connectorLines.push([
    offsetCoordinate(endAtTotal.coord, endAtTotal.normal, baseOffsetMeters),
    offsetCoordinate(endAtTotal.coord, endAtTotal.normal, maxExtrusionMeters)
  ]);

  return {
    alignmentId: alignment.id,
    baselineCoordinates,
    bars,
    isolines,
    connectorLines
  };
}
