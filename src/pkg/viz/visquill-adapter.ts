/**
 * Adaptador de Configuración y Datos para VisQuill GDK
 * Conforme a SPEC-04 (pkg/viz) y Directivas de Licenciamiento de la Constitución
 */

import { LrsAnalysisResult, SeverityLevel } from '../lrs/types.js';
import {
  MetricMode,
  SEVERITY_COLORS,
  VISQUILL_ATTRIBUTION
} from './types.js';

export interface VisQuillDataPoint {
  binIndex: number;
  chainageMeters: number;
  stationLabel: string;
  totalValue: number;
  fatalCount: number;
  graveCount: number;
  leveCount: number;
  danosCount: number;
  epdoScore: number;
  densityPerKm: number;
  // SPEC-14
  totalVehicles: number;
  totalPersons: number;
  personsBreakdown: {
    fallecido: number;
    lesionado: number;
    noSeConoce: number;
    ileso: number;
  };
}

export interface VisQuillChartConfig {
  containerId: string;
  attribution: string;
  xAxis: {
    title: string;
    minChainage: number;
    maxChainage: number;
    format: string;
  };
  yAxis: {
    title: string;
    mode: MetricMode;
  };
  palette: {
    fatal: string;
    grave: string;
    leve: string;
    danos: string;
  };
  data: VisQuillDataPoint[];
}

/**
 * Transforma el resultado del análisis LRS en una configuración lista
 * para el componente de perfil longitudinal de VisQuill GDK.
 *
 * @param results Resultado de análisis LRS
 * @param containerId ID del elemento contenedor DOM
 * @param metricMode Modo de métrica a graficar en el eje Y
 * @returns Configuración tipada para VisQuill GDK
 */
export function buildVisQuillConfig(
  results: LrsAnalysisResult,
  containerId: string = 'visquill-longitudinal-profile',
  metricMode: MetricMode = 'COUNT'
): VisQuillChartConfig {
  const yTitles: Record<MetricMode, string> = {
    COUNT: 'Número de Siniestros (Accidentes)',
    VEHICLES: 'Vehículos Involucrados',
    PERSONS: 'Personas Involucradas (Desagregado por Gravedad)',
    EPDO: 'Índice de Severidad Ponderada (EPDO)',
    DENSITY_KM: 'Densidad de Siniestros (Siniestros / km)'
  };

  const data: VisQuillDataPoint[] = results.bins.map((bin) => {
    let yValue = bin.totalCount;
    if (metricMode === 'VEHICLES') {
      yValue = bin.totalVehicles;
    } else if (metricMode === 'PERSONS') {
      yValue = bin.totalPersons;
    } else if (metricMode === 'EPDO') {
      yValue = bin.epdoScore;
    } else if (metricMode === 'DENSITY_KM') {
      yValue = bin.densityPerKm;
    }

    return {
      binIndex: bin.binIndex,
      chainageMeters: bin.startChainageMeters,
      stationLabel: bin.startStationFormatted,
      totalValue: yValue,
      fatalCount: bin.severityCounts[SeverityLevel.FATAL] || 0,
      graveCount: bin.severityCounts[SeverityLevel.LESIONES_GRAVES] || 0,
      leveCount: bin.severityCounts[SeverityLevel.LESIONES_LEVES] || 0,
      danosCount: bin.severityCounts[SeverityLevel.SOLO_DANOS] || 0,
      epdoScore: bin.epdoScore,
      densityPerKm: bin.densityPerKm,
      totalVehicles: bin.totalVehicles,
      totalPersons: bin.totalPersons,
      personsBreakdown: { ...bin.personsBreakdown }
    };
  });

  return {
    containerId,
    attribution: VISQUILL_ATTRIBUTION,
    xAxis: {
      title: 'Progresiva Longitudinal (km)',
      minChainage: 0,
      maxChainage: results.totalLengthMeters,
      format: 'km K+PPP'
    },
    yAxis: {
      title: yTitles[metricMode],
      mode: metricMode
    },
    palette: {
      fatal: SEVERITY_COLORS[SeverityLevel.FATAL],
      grave: SEVERITY_COLORS[SeverityLevel.LESIONES_GRAVES],
      leve: SEVERITY_COLORS[SeverityLevel.LESIONES_LEVES],
      danos: SEVERITY_COLORS[SeverityLevel.SOLO_DANOS]
    },
    data
  };
}
