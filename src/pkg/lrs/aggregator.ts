/**
 * Agregador Longitudinal y Segmentación Homogénea LRS
 * Conforme a SPEC-03 (pkg/lrs)
 */

import { Alignment } from '../tracer/types.js';
import { formatStation } from '../tracer/geodesy.js';
import {
  CrashPoint,
  ProjectedCrash,
  LrsBinAggregate,
  LrsEngineOptions,
  LrsAnalysisResult,
  SeverityLevel,
  CrashType,
  EpdoWeights
} from './types.js';
import { projectCrashOnAlignment } from './projection.js';

export const DEFAULT_BUFFER_WIDTH_METERS = 25;
export const DEFAULT_BIN_SIZE_METERS = 100;

export const DEFAULT_EPDO_WEIGHTS: EpdoWeights = {
  fatal: 9.5,
  grave: 3.5,
  leve: 1.0,
  soloDanos: 1.0
};

/**
 * Calcula el índice de severidad ponderada (EPDO) para un conjunto de conteos por severidad
 */
export function calculateEpdoScore(
  severityCounts: Record<SeverityLevel, number>,
  weights: EpdoWeights = DEFAULT_EPDO_WEIGHTS
): number {
  const fatalScore = (severityCounts[SeverityLevel.FATAL] || 0) * weights.fatal;
  const graveScore = (severityCounts[SeverityLevel.LESIONES_GRAVES] || 0) * weights.grave;
  const leveScore = (severityCounts[SeverityLevel.LESIONES_LEVES] || 0) * weights.leve;
  const danosScore = (severityCounts[SeverityLevel.SOLO_DANOS] || 0) * weights.soloDanos;

  return Math.round((fatalScore + graveScore + leveScore + danosScore) * 100) / 100;
}

/**
 * Orquestador principal del análisis LRS: proyecta siniestros, aplica buffer,
 * discretiza en tramos homogéneos métricos y computa métricas e índices EPDO.
 *
 * @param alignment Eje vial de referencia
 * @param crashes Colección de siniestros viales
 * @param options Configuración de buffer, tamaño de bin y ponderaciones
 * @returns Resultado analítico consolidado
 */
export function analyzeLrs(
  alignment: Alignment,
  crashes: CrashPoint[],
  options?: LrsEngineOptions
): LrsAnalysisResult {
  const startTime = performance.now();

  const bufferWidth = options?.bufferWidthMeters ?? DEFAULT_BUFFER_WIDTH_METERS;
  const binSize = options?.binSizeMeters ?? DEFAULT_BIN_SIZE_METERS;
  const epdoWeights: EpdoWeights = {
    ...DEFAULT_EPDO_WEIGHTS,
    ...options?.epdoWeights
  };

  if (binSize <= 0) {
    throw new Error(`El tamaño de bin debe ser mayor a 0 m. Recibido: ${binSize}`);
  }

  // 1. Proyectar cada siniestro sobre el alineamiento
  const projectedCrashes: ProjectedCrash[] = [];
  let insideBufferCount = 0;
  let outsideBufferCount = 0;

  for (const crash of crashes) {
    const projected = projectCrashOnAlignment(crash, alignment, bufferWidth);
    projectedCrashes.push(projected);

    if (projected.isInsideBuffer) {
      insideBufferCount++;
    } else {
      outsideBufferCount++;
    }
  }

  // 2. Inicializar bins longitudinales
  const totalLength = alignment.totalLength;
  const numBins = Math.max(1, Math.ceil(totalLength / binSize));
  const bins: LrsBinAggregate[] = [];

  for (let k = 0; k < numBins; k++) {
    const startMeters = k * binSize;
    const endMeters = Math.min(totalLength, (k + 1) * binSize);

    if (startMeters >= totalLength && k > 0) {
      break;
    }

    const severityCounts: Record<SeverityLevel, number> = {
      [SeverityLevel.FATAL]: 0,
      [SeverityLevel.LESIONES_GRAVES]: 0,
      [SeverityLevel.LESIONES_LEVES]: 0,
      [SeverityLevel.SOLO_DANOS]: 0
    };

    const typeCounts: Record<CrashType, number> = {
      [CrashType.CHOQUE]: 0,
      [CrashType.ATROPELLO]: 0,
      [CrashType.VOLCADURA]: 0,
      [CrashType.DESPISTE]: 0,
      [CrashType.CAIDA_PASAJERO]: 0,
      [CrashType.INCENDIO]: 0,
      [CrashType.OTRO]: 0
    };

    bins.push({
      binIndex: k,
      startChainageMeters: startMeters,
      endChainageMeters: endMeters,
      startStationFormatted: formatStation(startMeters),
      endStationFormatted: formatStation(endMeters),
      crashes: [],
      totalCount: 0,
      severityCounts,
      typeCounts,
      epdoScore: 0,
      densityPerKm: 0
    });
  }

  // 3. Asignar siniestros dentro de faja a los bins correspondientes
  for (const proj of projectedCrashes) {
    if (!proj.isInsideBuffer) {
      continue;
    }

    // Calcular índice del bin correspondiente según cadenamiento S_i
    let binIdx = Math.floor(proj.chainageMeters / binSize);
    if (binIdx >= bins.length) {
      binIdx = bins.length - 1;
    }
    if (binIdx < 0) {
      binIdx = 0;
    }

    const targetBin = bins[binIdx];
    targetBin.crashes.push(proj);
    targetBin.totalCount++;

    const sev = proj.crash.severity;
    if (targetBin.severityCounts[sev] !== undefined) {
      targetBin.severityCounts[sev]++;
    }

    const ctype = proj.crash.type;
    if (targetBin.typeCounts[ctype] !== undefined) {
      targetBin.typeCounts[ctype]++;
    }
  }

  // 4. Calcular métricas estadísticas (EPDO y Densidad por km) para cada bin
  for (const bin of bins) {
    bin.epdoScore = calculateEpdoScore(bin.severityCounts, epdoWeights);

    const binLengthKm = (bin.endChainageMeters - bin.startChainageMeters) / 1000;
    if (binLengthKm > 0) {
      bin.densityPerKm = Math.round((bin.totalCount / binLengthKm) * 100) / 100;
    } else {
      bin.densityPerKm = 0;
    }
  }

  const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    alignmentId: alignment.id,
    alignmentName: alignment.name,
    totalLengthMeters: alignment.totalLength,
    totalInputCrashes: crashes.length,
    projectedInsideBufferCount: insideBufferCount,
    projectedOutsideBufferCount: outsideBufferCount,
    projectedCrashes,
    bins,
    executionTimeMs
  };
}
