/**
 * Generador de archivos de texto plano (.txt) para alineamientos viales
 * Conforme a SPEC-05 y SPEC-15 (pkg/export)
 */

import { Alignment } from '../tracer/types.js';

/**
 * Genera una representación en texto plano estructurado de un alineamiento vial
 */
export function generateTxtAlignmentTrace(alignment: Alignment): string {
  const lines: string[] = [
    `# RoadSafetyScan - Trazo de Alineamiento Vial: ${alignment.id}`,
    `# Nombre: ${alignment.name}`,
    `# Longitud Total: ${(alignment.totalLength / 1000).toFixed(2)} km (${alignment.totalLength.toFixed(2)} m)`,
    'index,longitude,latitude,cumulative_meters,station'
  ];

  for (let i = 0; i < alignment.vertices.length; i++) {
    const v = alignment.vertices[i];
    const lon = v.coordinates.longitude.toFixed(6);
    const lat = v.coordinates.latitude.toFixed(6);
    const dist = v.cumulativeDistance.toFixed(2);
    lines.push(`${i},${lon},${lat},${dist},${v.stationFormatted}`);
  }

  return lines.join('\n') + '\n';
}
