/**
 * Generador Geométrico del Perfil Curvilíneo ("Profiles along a line")
 * Conforme a SPEC-06, SPEC-20, SPEC-23 y SPEC-24
 * Paradigma VisQuill GDK A1 Collision Density
 */

import { Alignment, GeoCoordinate } from '../tracer/types.js';
import { LrsAnalysisResult, SeverityLevel } from '../lrs/types.js';
import {
  computeSmoothedVertexNormals,
  offsetCoordinate,
  UnitVector2D
} from './normals.js';
import {
  untanglePolyline,
  untanglePolylineWithStations,
  smoothCoordinates
} from './anti-knot.js';
import {
  CurvilinearProfileOptions,
  CurvilinearBarFeature,
  CurvilinearIsolineFeature,
  CurvilinearProfileModel
} from './types.js';
import {
  haversineDistance,
  toRadians,
  EARTH_RADIUS_METERS
} from '../tracer/geodesy.js';

export const DEFAULT_CURVILINEAR_OPTIONS: CurvilinearProfileOptions = {
  offsetDistanceMeters: 1200, // 1.2 km de separación lateral por defecto
  side: 'RIGHT',
  heightScaleMetersPerUnit: 40, // 40 metros de altura visual por unidad de valor
  scaleTicks: [10, 20, 30, 40],
  smoothingWindowSize: 5,
  baselineMode: 'RECTILINEAR', // SPEC-31: Línea base rectilínea limpia por defecto (Paradigma VisQuill)
  borderCurvatureRatio: 0.05   // Curva terminal reservada casi al último (90% plano, 5% remate en cada extremo)
};

/**
 * Representación parametrizada de la línea base regularizada (SPEC-24, SPEC-27)
 */
export interface BaselineArcLengthProfile {
  coordinates: [number, number][];
  stations?: number[];           // Progresivas viales vinculadas a cada vértice (SPEC-27)
  cumulativeDistances: number[]; // metros acumulados desde 0 hasta totalLength
  totalLength: number;
  normals: UnitVector2D[];       // Vectores normales unitarios orientados hacia el exterior
}

/**
 * Construye el perfil de la línea base regularizada (SPEC-24, SPEC-27)
 * a partir de las coordenadas desplazadas brutas y sus progresivas viales correspondientes.
 *
 * @param rawCoordinates Polilínea de offset bruta
 * @param side Lado del perfil ('RIGHT' o 'LEFT')
 * @param inputStations Progresivas viales asociadas a cada coordenada (SPEC-27)
 */
export function buildBaselineArcLengthProfile(
  rawCoordinates: [number, number][],
  side: 'LEFT' | 'RIGHT' = 'RIGHT',
  inputStations?: number[]
): BaselineArcLengthProfile {
  // 1. Desenredo de lazos y suavizado gaussiano (SPEC-20, SPEC-27)
  let smoothed: [number, number][];
  let stations: number[] | undefined = undefined;

  if (inputStations && inputStations.length === rawCoordinates.length) {
    const untangled = untanglePolylineWithStations(rawCoordinates, inputStations);
    smoothed = smoothCoordinates(untangled.coordinates, 5, 2);
    stations = untangled.stations;
  } else {
    const untangled = untanglePolyline(rawCoordinates);
    smoothed = smoothCoordinates(untangled, 5, 2);
  }

  if (smoothed.length === 0) {
    return {
      coordinates: [],
      cumulativeDistances: [],
      totalLength: 0,
      normals: []
    };
  }

  if (smoothed.length === 1) {
    return {
      coordinates: smoothed,
      cumulativeDistances: [0],
      totalLength: 0,
      normals: [{ x: 1, y: 0 }]
    };
  }

  // 2. Cálculo de distancias geodésicas acumuladas a lo largo de la polilínea base
  const cumulativeDistances: number[] = [0];
  let totalLength = 0;
  for (let i = 1; i < smoothed.length; i++) {
    const dist = haversineDistance(
      { longitude: smoothed[i - 1][0], latitude: smoothed[i - 1][1] },
      { longitude: smoothed[i][0], latitude: smoothed[i][1] }
    );
    totalLength += dist;
    cumulativeDistances.push(totalLength);
  }

  // 3. Normales de los segmentos de la línea base orientadas hacia el exterior
  const sideSign = side === 'RIGHT' ? 1 : -1;
  const segmentNormals: UnitVector2D[] = [];

  for (let i = 0; i < smoothed.length - 1; i++) {
    const p1 = smoothed[i];
    const p2 = smoothed[i + 1];
    const meanLat = toRadians((p1[1] + p2[1]) / 2);
    const dx = toRadians(p2[0] - p1[0]) * EARTH_RADIUS_METERS * Math.cos(meanLat);
    const dy = toRadians(p2[1] - p1[1]) * EARTH_RADIUS_METERS;
    const len = Math.hypot(dx, dy) || 1;

    // Tangente unitaria: (dx/len, dy/len)
    // Para RIGHT: normal exterior hacia la derecha (dy/len, -dx/len)
    // Para LEFT: normal exterior hacia la izquierda (-dy/len, dx/len)
    segmentNormals.push({
      x: sideSign * (dy / len),
      y: sideSign * (-dx / len)
    });
  }

  // 4. Normales por vértice promediando segmentos adyacentes
  const normals: UnitVector2D[] = [];
  for (let i = 0; i < smoothed.length; i++) {
    if (i === 0) {
      normals.push(segmentNormals[0] || { x: 1, y: 0 });
    } else if (i === smoothed.length - 1) {
      normals.push(segmentNormals[segmentNormals.length - 1] || { x: 1, y: 0 });
    } else {
      const n1 = segmentNormals[i - 1];
      const n2 = segmentNormals[i];
      const nx = n1.x + n2.x;
      const ny = n1.y + n2.y;
      const len = Math.hypot(nx, ny) || 1;
      normals.push({ x: nx / len, y: ny / len });
    }
  }

  return {
    coordinates: smoothed,
    stations,
    cumulativeDistances,
    totalLength,
    normals
  };
}

/**
 * SPEC-31, SPEC-32 & SPEC-34: Construye una línea base estable con bordes curvos
 * invariables hacia el lado opuesto de las barras en cualquier nivel de zoom (VisQuill Clean & Stable Paradigm).
 *
 * - Cuerpo central rectilíneo y ortogonal: Paralelo a la secante del tramo visible o corredor,
 *   con normal constante, barras ortogonales sin deformación e isolíneas paralelas.
 * - Bordes curvos en cualquier nivel de zoom (SPEC-34): Los extremos terminales (borderCurvatureRatio, default 0.15)
 *   SIEMPRE se curvan hacia el lado contrario de las barras (hacia la carretera / hacia abajo),
 *   con transición continua C1 y deflexión cóncava.
 * - Proximidad métrica garantizada: La baseline mantiene la distancia offset nominal (offsetDistanceMeters)
 *   respecto al corredor visible, evitando alejamientos excesivos de los controles.
 */
export function buildRectilinearBaselineProfile(
  alignment: Alignment,
  vertexNormals: UnitVector2D[],
  rangeStart: number,
  rangeEnd: number,
  offsetDistanceMeters: number,
  side: 'LEFT' | 'RIGHT' = 'RIGHT',
  uniqueStations: number[] = [],
  borderCurvatureRatio: number = 0.05
): BaselineArcLengthProfile {
  const totalRoadLength = alignment.totalLength;
  const sideSign = side === 'RIGHT' ? 1 : -1;

  if (totalRoadLength <= 0 || uniqueStations.length === 0) {
    return {
      coordinates: [],
      stations: [],
      cumulativeDistances: [],
      totalLength: 0,
      normals: []
    };
  }

  // 1. Determinar el tramo geométrico de referencia [sMin, sMax] (SPEC-34)
  const sMin = uniqueStations[0];
  const sMax = uniqueStations[uniqueStations.length - 1];
  const span = sMax - sMin;

  const refStart = interpolateAtStation(alignment, vertexNormals, sMin);
  const refEnd = interpolateAtStation(alignment, vertexNormals, sMax);

  const meanLat = toRadians((refStart.coord.latitude + refEnd.coord.latitude) / 2);
  const mPerDegLat = toRadians(1) * EARTH_RADIUS_METERS;
  const mPerDegLon = mPerDegLat * Math.cos(meanLat);

  const cdx = (refEnd.coord.longitude - refStart.coord.longitude) * mPerDegLon;
  const cdy = (refEnd.coord.latitude - refStart.coord.latitude) * mPerDegLat;
  const chordLen = Math.hypot(cdx, cdy);

  let tangent: UnitVector2D;
  let outwardNormal: UnitVector2D;

  if (chordLen > 1.0) {
    const tux = cdx / chordLen;
    const tuy = cdy / chordLen;
    tangent = { x: tux, y: tuy };
    outwardNormal = {
      x: sideSign * tuy,
      y: sideSign * (-tux)
    };
  } else {
    tangent = { x: -sideSign * refStart.normal.y, y: sideSign * refStart.normal.x };
    outwardNormal = {
      x: sideSign * refStart.normal.x,
      y: sideSign * refStart.normal.y
    };
  }

  // 2. Garantía Anti-Superposición (SPEC-35): Determinar la flecha máxima del eje vial hacia el lado del perfil
  let maxRoadBulgeMeters = 0;
  for (const s of uniqueStations) {
    const tau = span > 0 ? (s - sMin) / span : 0;
    const sLon = refStart.coord.longitude + tau * (refEnd.coord.longitude - refStart.coord.longitude);
    const sLat = refStart.coord.latitude + tau * (refEnd.coord.latitude - refStart.coord.latitude);

    const roadPt = interpolateAtStation(alignment, vertexNormals, s);
    const rx = (roadPt.coord.longitude - sLon) * mPerDegLon;
    const ry = (roadPt.coord.latitude - sLat) * mPerDegLat;
    const lateralDist = rx * outwardNormal.x + ry * outwardNormal.y;
    if (lateralDist > maxRoadBulgeMeters) {
      maxRoadBulgeMeters = lateralDist;
    }
  }

  // Despeje efectivo garantizado: asegura que incluso en la curva más cerrada, la baseline diste al menos offsetDistanceMeters
  const effectiveBaseOffset = offsetDistanceMeters + maxRoadBulgeMeters;

  // 3. Evaluar cada progresiva sobre la secante con remates terminales en cuarto de círculo (SPEC-36)
  const coordinates: [number, number][] = [];
  const normals: UnitVector2D[] = [];

  const rho = Math.max(0, Math.min(0.40, borderCurvatureRatio));
  const thetaMax = (45 * Math.PI) / 180; // ~45 grados: deflexión suave y tendida en el último borde
  const rCurl = Math.min(effectiveBaseOffset * 0.65, span * 0.10); // Curva confinada al remate final (la gran mayoría permanece plana)

  // Puntos de unión con el cuerpo central rectilíneo
  const tauStartJunc = rho;
  const tauEndJunc = 1 - rho;

  const spineLonStartJunc = refStart.coord.longitude + tauStartJunc * (refEnd.coord.longitude - refStart.coord.longitude);
  const spineLatStartJunc = refStart.coord.latitude + tauStartJunc * (refEnd.coord.latitude - refStart.coord.latitude);
  const ptStartJunc = offsetCoordinate({ longitude: spineLonStartJunc, latitude: spineLatStartJunc }, outwardNormal, effectiveBaseOffset);

  const spineLonEndJunc = refStart.coord.longitude + tauEndJunc * (refEnd.coord.longitude - refStart.coord.longitude);
  const spineLatEndJunc = refStart.coord.latitude + tauEndJunc * (refEnd.coord.latitude - refStart.coord.latitude);
  const ptEndJunc = offsetCoordinate({ longitude: spineLonEndJunc, latitude: spineLatEndJunc }, outwardNormal, effectiveBaseOffset);

  for (const s of uniqueStations) {
    const tau = span > 0 ? Math.max(0, Math.min(1, (s - sMin) / span)) : 0;

    if (rho > 0 && tau < rho) {
      // Borde Inicial (s -> sMin): Cuarto de circunferencia en espiral curvándose hacia la carretera
      // u: 0 en la unión (tau = rho), 1 en el extremo inicial (tau = 0)
      const u = (rho - tau) / rho;
      const theta = thetaMax * 0.5 * (1 - Math.cos(Math.PI * u));

      // Desplazamiento métrico respecto al punto de unión:
      // dx: hacia atrás en la dirección tangencial (-tangent)
      // dy: hacia la carretera (-outwardNormal)
      const dxMeters = -rCurl * Math.sin(theta);
      const dyMeters = -rCurl * (1 - Math.cos(theta));

      const dispX = dxMeters * tangent.x + dyMeters * outwardNormal.x;
      const dispY = dxMeters * tangent.y + dyMeters * outwardNormal.y;

      const lon = Number((ptStartJunc[0] + dispX / mPerDegLon).toFixed(6));
      const lat = Number((ptStartJunc[1] + dispY / mPerDegLat).toFixed(6));

      // La normal de las barras rota suavemente acompañando la curvatura del arco
      const nx = Math.cos(theta) * outwardNormal.x - Math.sin(theta) * tangent.x;
      const ny = Math.cos(theta) * outwardNormal.y - Math.sin(theta) * tangent.y;
      const nLen = Math.hypot(nx, ny) || 1;

      coordinates.push([lon, lat]);
      normals.push({ x: nx / nLen, y: ny / nLen });
    } else if (rho > 0 && tau > 1 - rho) {
      // Borde Final (s -> sMax): Cuarto de circunferencia en espiral curvándose hacia la carretera (línea verde del usuario)
      // u: 0 en la unión (tau = 1 - rho), 1 en el extremo final (tau = 1)
      const u = (tau - (1 - rho)) / rho;
      const theta = thetaMax * 0.5 * (1 - Math.cos(Math.PI * u));

      // Desplazamiento métrico respecto al punto de unión:
      // dx: avance a lo largo de la tangente (+tangent)
      // dy: hacia la carretera (-outwardNormal)
      const dxMeters = rCurl * Math.sin(theta);
      const dyMeters = -rCurl * (1 - Math.cos(theta));

      const dispX = dxMeters * tangent.x + dyMeters * outwardNormal.x;
      const dispY = dxMeters * tangent.y + dyMeters * outwardNormal.y;

      const lon = Number((ptEndJunc[0] + dispX / mPerDegLon).toFixed(6));
      const lat = Number((ptEndJunc[1] + dispY / mPerDegLat).toFixed(6));

      // La normal de las barras rota suavemente acompañando la curvatura del arco
      const nx = Math.cos(theta) * outwardNormal.x + Math.sin(theta) * tangent.x;
      const ny = Math.cos(theta) * outwardNormal.y + Math.sin(theta) * tangent.y;
      const nLen = Math.hypot(nx, ny) || 1;

      coordinates.push([lon, lat]);
      normals.push({ x: nx / nLen, y: ny / nLen });
    } else {
      // Cuerpo central estrictamente rectilíneo con normal uniforme constante
      const spineLon = refStart.coord.longitude + tau * (refEnd.coord.longitude - refStart.coord.longitude);
      const spineLat = refStart.coord.latitude + tau * (refEnd.coord.latitude - refStart.coord.latitude);
      const pt = offsetCoordinate({ longitude: spineLon, latitude: spineLat }, outwardNormal, effectiveBaseOffset);
      coordinates.push(pt);
      normals.push(outwardNormal);
    }
  }

  // 3. Distancias acumuladas geodésicas sobre la línea base generada
  const cumulativeDistances: number[] = [0];
  let LB = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const d = haversineDistance(
      { longitude: coordinates[i - 1][0], latitude: coordinates[i - 1][1] },
      { longitude: coordinates[i][0], latitude: coordinates[i][1] }
    );
    LB += d;
    cumulativeDistances.push(LB);
  }

  return {
    coordinates,
    stations: uniqueStations,
    cumulativeDistances,
    totalLength: LB,
    normals
  };
}

/**
 * Muestrea una posición exacta y vector normal sobre la línea base regularizada
 * correspondiente a la progresiva vial s (SPEC-27: Mapeo Local Estacionado).
 *
 * Acota estrictamente la desviación respecto a la proyección ortogonal pura a <= 25 m,
 * eliminando el desfase longitudinal acumulativo en curvas.
 */
export function sampleBaselineAtStation(
  baseline: BaselineArcLengthProfile,
  s: number
): { coord: [number, number]; normal: UnitVector2D } {
  const { coordinates, stations, normals } = baseline;
  if (!coordinates || coordinates.length === 0) {
    return { coord: [0, 0], normal: { x: 1, y: 0 } };
  }
  if (coordinates.length === 1 || !stations || stations.length < 2) {
    return { coord: coordinates[0], normal: normals[0] || { x: 1, y: 0 } };
  }

  const sMin = stations[0];
  const sMax = stations[stations.length - 1];
  const clampedS = Math.max(sMin, Math.min(sMax, s));

  for (let i = 0; i < stations.length - 1; i++) {
    const sStart = stations[i];
    const sEnd = stations[i + 1];

    if (clampedS >= sStart && (clampedS <= sEnd || i === stations.length - 2)) {
      const segSpan = sEnd - sStart;
      const t = segSpan > 0 ? (clampedS - sStart) / segSpan : 0;
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];

      const lon = Number((p1[0] + t * (p2[0] - p1[0])).toFixed(6));
      const lat = Number((p1[1] + t * (p2[1] - p1[1])).toFixed(6));

      const n1 = normals[i];
      const n2 = normals[i + 1] || n1;
      const nx = n1.x + t * (n2.x - n1.x);
      const ny = n1.y + t * (n2.y - n1.y);
      const len = Math.hypot(nx, ny) || 1;

      return {
        coord: [lon, lat],
        normal: { x: nx / len, y: ny / len }
      };
    }
  }

  return {
    coord: coordinates[coordinates.length - 1],
    normal: normals[normals.length - 1]
  };
}

/**
 * Muestrea una posición exacta y vector normal a lo largo de la línea base por longitud de arco u (SPEC-24)
 */
export function sampleBaselineAtArcLength(
  baseline: BaselineArcLengthProfile,
  u: number
): { coord: [number, number]; normal: UnitVector2D } {
  const { coordinates, cumulativeDistances, totalLength, normals } = baseline;
  if (coordinates.length === 0) {
    return { coord: [0, 0], normal: { x: 1, y: 0 } };
  }
  if (coordinates.length === 1 || totalLength <= 0) {
    return { coord: coordinates[0], normal: normals[0] || { x: 1, y: 0 } };
  }

  const clampedU = Math.max(0, Math.min(totalLength, u));

  // Localizar el segmento correspondiente
  for (let i = 0; i < cumulativeDistances.length - 1; i++) {
    const uStart = cumulativeDistances[i];
    const uEnd = cumulativeDistances[i + 1];

    if (clampedU >= uStart && (clampedU <= uEnd || i === cumulativeDistances.length - 2)) {
      const segLen = uEnd - uStart;
      const t = segLen > 0 ? (clampedU - uStart) / segLen : 0;
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];

      const lon = Number((p1[0] + t * (p2[0] - p1[0])).toFixed(6));
      const lat = Number((p1[1] + t * (p2[1] - p1[1])).toFixed(6));

      const n1 = normals[i];
      const n2 = normals[i + 1] || n1;
      const nx = n1.x + t * (n2.x - n1.x);
      const ny = n1.y + t * (n2.y - n1.y);
      const len = Math.hypot(nx, ny) || 1;

      return {
        coord: [lon, lat],
        normal: { x: nx / len, y: ny / len }
      };
    }
  }

  return {
    coord: coordinates[coordinates.length - 1],
    normal: normals[normals.length - 1]
  };
}

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
 * Calcula exactamente 4 marcas de escala concéntricas legibles para la grilla (SPEC-28).
 * Siempre retorna un arreglo de 4 valores monótonos crecientes [S, 2S, 3S, 4S].
 *
 * @param maxVal Valor máximo registrado en los bins analizados
 * @returns Tupla con exactamente 4 marcas de graduación regulares
 */
export function compute4ScaleTicks(maxVal: number): [number, number, number, number] {
  if (maxVal <= 0) {
    return [10, 20, 30, 40];
  }

  // Se necesita un paso S tal que 4 * S >= maxVal
  const rawStep = maxVal / 4;
  const p = Math.floor(Math.log10(rawStep));
  const base = Math.pow(10, p);
  const f = rawStep / base;

  let factor = 1;
  if (f <= 1) factor = 1;
  else if (f <= 1.5) factor = 1.5;
  else if (f <= 2) factor = 2;
  else if (f <= 2.5) factor = 2.5;
  else if (f <= 3) factor = 3;
  else if (f <= 5) factor = 5;
  else if (f <= 7.5) factor = 7.5;
  else factor = 10;

  let step = factor * base;
  if (step < 1) step = 1;
  step = Math.round(step * 100) / 100;

  return [step, step * 2, step * 3, step * 4];
}

/**
 * Interpola una coordenada geográfica y su vector normal para una progresiva métrica s
 */
export function interpolateAtStation(
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
 * Genera el modelo geométrico completo del perfil curvilíneo paralelo al trazo (SPEC-06, SPEC-23, SPEC-24)
 * utilizando mapeo por desplazamiento relativo a la línea base y anclaje estricto sin deformaciones.
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

  const sideSign = opts.side === 'RIGHT' ? 1 : -1;
  const baseOffsetMeters = opts.offsetDistanceMeters * sideSign;

  // 1. Determinar intervalo longitudinal de muestreo y recorte al viewport (SPEC-23)
  const rangeStart = opts.visibleRange ? Math.max(0, opts.visibleRange[0]) : 0;
  const rangeEnd = opts.visibleRange ? Math.min(alignment.totalLength, opts.visibleRange[1]) : alignment.totalLength;
  const rangeLength = rangeEnd - rangeStart;

  if (rangeLength <= 0) {
    return {
      alignmentId: alignment.id,
      baselineCoordinates: [],
      bars: [],
      isolines: [],
      connectorLines: []
    };
  }

  // 2. Muestrear la carretera a intervalos finos para generar la Línea Base Desplazada B(s)
  const sampleStations: number[] = [];
  const sampleStep = Math.min(50, Math.max(10, rangeLength / 100));

  for (let s = rangeStart; s <= rangeEnd; s += sampleStep) {
    sampleStations.push(s);
  }
  if (sampleStations.length === 0 || sampleStations[sampleStations.length - 1] < rangeEnd) {
    sampleStations.push(rangeEnd);
  }

  // Incluir vértices del eje vial que se encuentren en el rango
  for (const v of alignment.vertices) {
    if (v.cumulativeDistance > rangeStart && v.cumulativeDistance < rangeEnd) {
      sampleStations.push(v.cumulativeDistance);
    }
  }

  // Ordenar y deduplicar progresivas
  sampleStations.sort((a, b) => a - b);
  const uniqueStations: number[] = [];
  for (let i = 0; i < sampleStations.length; i++) {
    if (i === 0 || sampleStations[i] - uniqueStations[uniqueStations.length - 1] > 1.0) {
      uniqueStations.push(sampleStations[i]);
    }
  }

  // Construir el perfil parametrizado de la línea base (SPEC-24, SPEC-27, SPEC-31)
  let baselineProfile: BaselineArcLengthProfile;
  if (opts.baselineMode === 'CURVED_OFFSET') {
    const rawBaselineCoordinates: [number, number][] = uniqueStations.map((s) => {
      const { coord, normal } = interpolateAtStation(alignment, vertexNormals, s);
      return offsetCoordinate(coord, normal, baseOffsetMeters);
    });
    baselineProfile = buildBaselineArcLengthProfile(rawBaselineCoordinates, opts.side, uniqueStations);
  } else {
    // SPEC-31, SPEC-32 & SPEC-36: Línea Base Estable con Remates Terminales (90% plano, 5% curva en cada extremo)
    const borderRatio = typeof opts.borderCurvatureRatio === 'number' ? opts.borderCurvatureRatio : 0.05;
    baselineProfile = buildRectilinearBaselineProfile(
      alignment,
      vertexNormals,
      rangeStart,
      rangeEnd,
      opts.offsetDistanceMeters,
      opts.side,
      uniqueStations,
      borderRatio
    );
  }

  const baselineCoordinates = baselineProfile.coordinates;
  const LB = baselineProfile.totalLength;

  if (baselineCoordinates.length < 2 || LB <= 0) {
    return {
      alignmentId: alignment.id,
      baselineCoordinates,
      bars: [],
      isolines: [],
      connectorLines: []
    };
  }

  // 3. Generar Barras Poligonales Extruidas Ortogonalmente a la Línea Base (SPEC-24, SPEC-27)
  const bars: CurvilinearBarFeature[] = [];

  for (const bin of results.bins) {
    const sStart = bin.startChainageMeters;
    const sEnd = bin.endChainageMeters;

    // Si hay visibleRange, omitir bins completamente fuera del rango visible (SPEC-23)
    if (opts.visibleRange) {
      if (sEnd <= rangeStart || sStart >= rangeEnd) {
        continue;
      }
    }

    const clampedStart = Math.max(rangeStart, sStart);
    const clampedEnd = Math.min(rangeEnd, sEnd);
    if (clampedEnd <= clampedStart) continue;

    // SPEC-27: Mapeo local estacionado para eliminar desfase longitudinal acumulativo
    const baseStart = baselineProfile.stations
      ? sampleBaselineAtStation(baselineProfile, clampedStart)
      : sampleBaselineAtArcLength(baselineProfile, ((clampedStart - rangeStart) / rangeLength) * LB);

    const baseEnd = baselineProfile.stations
      ? sampleBaselineAtStation(baselineProfile, clampedEnd)
      : sampleBaselineAtArcLength(baselineProfile, ((clampedEnd - rangeStart) / rangeLength) * LB);

    const pStart = baseStart.coord;
    const pEnd = baseEnd.coord;
    const nStart = baseStart.normal;
    const nEnd = baseEnd.normal;

    if (opts.metricMode === 'PERSONS') {
      const fallecido = bin.personsBreakdown?.fallecido ?? 0;
      const lesionado = bin.personsBreakdown?.lesionado ?? 0;
      const noSeConoce = bin.personsBreakdown?.noSeConoce ?? 0;
      const ileso = bin.personsBreakdown?.ileso ?? 0;
      const totalPersons = bin.totalPersons ?? (fallecido + lesionado + noSeConoce + ileso);

      // SPEC-24: Supresión de bins con valor 0 para no saturar zonas limpias de la carretera
      if (totalPersons <= 0) {
        continue;
      }

      const slices = [
        { key: 'FALLECIDO' as const, count: fallecido, color: '#DC2626' },
        { key: 'LESIONADO' as const, count: lesionado, color: '#EA580C' },
        { key: 'NO_CONOCE' as const, count: noSeConoce, color: '#94A3B8' },
        { key: 'ILESO' as const, count: ileso, color: '#10B981' }
      ].filter((s) => s.count > 0);

      if (slices.length === 0) {
        const barHeightMeters = totalPersons * opts.heightScaleMetersPerUnit;
        const qStart = offsetCoordinate({ longitude: pStart[0], latitude: pStart[1] }, nStart, barHeightMeters);
        const qEnd = offsetCoordinate({ longitude: pEnd[0], latitude: pEnd[1] }, nEnd, barHeightMeters);
        bars.push({
          binIndex: bin.binIndex,
          startChainageMeters: sStart,
          endChainageMeters: sEnd,
          startStationFormatted: bin.startStationFormatted,
          endStationFormatted: bin.endStationFormatted,
          value: totalPersons,
          heightMeters: barHeightMeters,
          polygonCoordinates: [pStart, qStart, qEnd, pEnd, pStart],
          severityBreakdown: {
            fatal: bin.severityCounts[SeverityLevel.FATAL] || 0,
            grave: bin.severityCounts[SeverityLevel.LESIONES_GRAVES] || 0,
            leve: bin.severityCounts[SeverityLevel.LESIONES_LEVES] || 0,
            danos: bin.severityCounts[SeverityLevel.SOLO_DANOS] || 0
          },
          totalVehicles: bin.totalVehicles,
          totalPersons,
          personsBreakdown: { ...bin.personsBreakdown },
          fillColor: '#7C3AED'
        });
      } else {
        let currentHeight = 0;
        for (const slice of slices) {
          const sliceHeightMeters = slice.count * opts.heightScaleMetersPerUnit;
          const nextHeight = currentHeight + sliceHeightMeters;

          const pSliceStart = offsetCoordinate({ longitude: pStart[0], latitude: pStart[1] }, nStart, currentHeight);
          const pSliceEnd = offsetCoordinate({ longitude: pEnd[0], latitude: pEnd[1] }, nEnd, currentHeight);
          const qSliceStart = offsetCoordinate({ longitude: pStart[0], latitude: pStart[1] }, nStart, nextHeight);
          const qSliceEnd = offsetCoordinate({ longitude: pEnd[0], latitude: pEnd[1] }, nEnd, nextHeight);

          bars.push({
            binIndex: bin.binIndex,
            startChainageMeters: sStart,
            endChainageMeters: sEnd,
            startStationFormatted: bin.startStationFormatted,
            endStationFormatted: bin.endStationFormatted,
            value: totalPersons,
            heightMeters: sliceHeightMeters,
            polygonCoordinates: [pSliceStart, qSliceStart, qSliceEnd, pSliceEnd, pSliceStart],
            severityBreakdown: {
              fatal: bin.severityCounts[SeverityLevel.FATAL] || 0,
              grave: bin.severityCounts[SeverityLevel.LESIONES_GRAVES] || 0,
              leve: bin.severityCounts[SeverityLevel.LESIONES_LEVES] || 0,
              danos: bin.severityCounts[SeverityLevel.SOLO_DANOS] || 0
            },
            totalVehicles: bin.totalVehicles,
            totalPersons,
            personsBreakdown: { ...bin.personsBreakdown },
            subCategory: slice.key,
            subCount: slice.count,
            fillColor: slice.color
          });

          currentHeight = nextHeight;
        }
      }
    } else {
      // Modos de extrusión simple (COUNT, VEHICLES, EPDO, DENSITY_KM)
      let value = bin.totalCount;
      let defaultColor = '#7C3AED';

      if (opts.metricMode === 'VEHICLES') {
        value = bin.totalVehicles;
        defaultColor = '#0284C7';
      } else if (opts.metricMode === 'EPDO') {
        value = bin.epdoScore;
        defaultColor = '#DC2626';
      } else if (opts.metricMode === 'DENSITY_KM') {
        value = bin.densityPerKm;
        defaultColor = '#7C3AED';
      } else {
        const fatal = bin.severityCounts[SeverityLevel.FATAL] || 0;
        const grave = bin.severityCounts[SeverityLevel.LESIONES_GRAVES] || 0;
        const leve = bin.severityCounts[SeverityLevel.LESIONES_LEVES] || 0;
        const danos = bin.severityCounts[SeverityLevel.SOLO_DANOS] || 0;
        defaultColor = fatal > 0
          ? '#DC2626'
          : grave > 0
          ? '#EA580C'
          : leve > 0
          ? '#FACC15'
          : danos > 0
          ? '#2563EB'
          : '#7C3AED';
      }

      // SPEC-24: Supresión de bins con valor 0
      if (value <= 0) {
        continue;
      }

      const barHeightMeters = value * opts.heightScaleMetersPerUnit;
      const qStart = offsetCoordinate({ longitude: pStart[0], latitude: pStart[1] }, nStart, barHeightMeters);
      const qEnd = offsetCoordinate({ longitude: pEnd[0], latitude: pEnd[1] }, nEnd, barHeightMeters);

      bars.push({
        binIndex: bin.binIndex,
        startChainageMeters: sStart,
        endChainageMeters: sEnd,
        startStationFormatted: bin.startStationFormatted,
        endStationFormatted: bin.endStationFormatted,
        value,
        heightMeters: barHeightMeters,
        polygonCoordinates: [pStart, qStart, qEnd, pEnd, pStart],
        severityBreakdown: {
          fatal: bin.severityCounts[SeverityLevel.FATAL] || 0,
          grave: bin.severityCounts[SeverityLevel.LESIONES_GRAVES] || 0,
          leve: bin.severityCounts[SeverityLevel.LESIONES_LEVES] || 0,
          danos: bin.severityCounts[SeverityLevel.SOLO_DANOS] || 0
        },
        totalVehicles: bin.totalVehicles,
        totalPersons: bin.totalPersons,
        personsBreakdown: { ...bin.personsBreakdown },
        fillColor: defaultColor
      });
    }
  }

  // 4. Generar Isolíneas Concéntricas de Escala Curvilíneas sobre la Línea Base (SPEC-24, SPEC-28)
  let activeTicks: number[] = opts.scaleTicks;
  if (!options?.scaleTicks || options.scaleTicks.length !== 4) {
    const maxVal = results.bins.reduce((max, b) => {
      let v = b.totalCount;
      if (opts.metricMode === 'VEHICLES') v = b.totalVehicles ?? 0;
      else if (opts.metricMode === 'PERSONS') v = b.totalPersons ?? 0;
      else if (opts.metricMode === 'EPDO') v = b.epdoScore ?? 0;
      else if (opts.metricMode === 'DENSITY_KM') v = b.densityPerKm ?? 0;
      return Math.max(max, v);
    }, 0);

    activeTicks = compute4ScaleTicks(maxVal);
  }

  const isolines: CurvilinearIsolineFeature[] = [];

  for (const tickVal of activeTicks) {
    const tickHeightMeters = tickVal * opts.heightScaleMetersPerUnit;

    const lineCoordinates: [number, number][] = baselineCoordinates.map((coord, idx) => {
      const normal = baselineProfile.normals[idx];
      return offsetCoordinate({ longitude: coord[0], latitude: coord[1] }, normal, tickHeightMeters);
    });

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

  // 5. Rayos conectores transversales y grilla radial (SPEC-24)
  const connectorLines: [number, number][][] = [];
  const maxTick = activeTicks.length > 0 ? Math.max(...activeTicks, 10) : 10;
  const maxExtrusionMeters = maxTick * opts.heightScaleMetersPerUnit;

  if (baselineCoordinates.length >= 2) {
    // Conector inicial (en el primer vértice de la baseline)
    const firstCoord = baselineCoordinates[0];
    const firstNormal = baselineProfile.normals[0];
    connectorLines.push([
      firstCoord,
      offsetCoordinate({ longitude: firstCoord[0], latitude: firstCoord[1] }, firstNormal, maxExtrusionMeters)
    ]);

    // Conectores transversales intermedios de la grilla (VisQuill radial grid)
    const gridTicks = [0.25, 0.5, 0.75];
    for (const frac of gridTicks) {
      const sampled = baselineProfile.stations
        ? sampleBaselineAtStation(baselineProfile, rangeStart + frac * rangeLength)
        : sampleBaselineAtArcLength(baselineProfile, frac * LB);
      connectorLines.push([
        sampled.coord,
        offsetCoordinate({ longitude: sampled.coord[0], latitude: sampled.coord[1] }, sampled.normal, maxExtrusionMeters)
      ]);
    }

    // Conector final (en el último vértice de la baseline)
    const lastCoord = baselineCoordinates[baselineCoordinates.length - 1];
    const lastNormal = baselineProfile.normals[baselineProfile.normals.length - 1];
    connectorLines.push([
      lastCoord,
      offsetCoordinate({ longitude: lastCoord[0], latitude: lastCoord[1] }, lastNormal, maxExtrusionMeters)
    ]);
  }

  return {
    alignmentId: alignment.id,
    baselineCoordinates,
    bars,
    isolines,
    connectorLines,
    baselineProfile
  };
}
