/**
 * Generador de Reportes Tabulares en CSV con UTF-8 BOM
 * Conforme a SPEC-05 (pkg/export)
 */

import { LrsAnalysisResult, SeverityLevel, CrashType } from '../lrs/types.js';

export const CSV_BOM = '\uFEFF';

export const CSV_HEADERS = [
  'bin_index',
  'prog_inicio_m',
  'prog_fin_m',
  'estacion_inicio',
  'estacion_fin',
  'total_siniestros',
  'siniestros_fatales',
  'lesiones_graves',
  'lesiones_leves',
  'solo_danos',
  'indice_epdo',
  'densidad_por_km',
  'tipo_predominante'
].join(',');

/**
 * Determina el tipo de siniestro más frecuente en un desglose tipológico
 */
export function getPredominantCrashType(typeCounts: Record<CrashType, number>): string {
  let maxCount = 0;
  let predominant: string = 'NINGUNO';

  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      predominant = type;
    }
  }

  return predominant;
}

/**
 * Genera el reporte CSV del perfil longitudinal con codificación UTF-8 BOM
 * para compatibilidad directa con Microsoft Excel en español (Perú).
 *
 * @param results Resultado del análisis LRS
 * @returns Cadena de texto formateada en CSV con BOM
 */
export function generateCsvProfileReport(results: LrsAnalysisResult): string {
  const rows: string[] = [CSV_HEADERS];

  for (const bin of results.bins) {
    const predominant = getPredominantCrashType(bin.typeCounts);

    const row = [
      bin.binIndex,
      bin.startChainageMeters.toFixed(2),
      bin.endChainageMeters.toFixed(2),
      `"${bin.startStationFormatted}"`,
      `"${bin.endStationFormatted}"`,
      bin.totalCount,
      bin.severityCounts[SeverityLevel.FATAL] || 0,
      bin.severityCounts[SeverityLevel.LESIONES_GRAVES] || 0,
      bin.severityCounts[SeverityLevel.LESIONES_LEVES] || 0,
      bin.severityCounts[SeverityLevel.SOLO_DANOS] || 0,
      bin.epdoScore.toFixed(2),
      bin.densityPerKm.toFixed(2),
      `"${predominant}"`
    ].join(',');

    rows.push(row);
  }

  return `${CSV_BOM}${rows.join('\n')}`;
}
