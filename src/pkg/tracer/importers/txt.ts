/**
 * Importador de Alineamientos Viales en formato de archivo plano .txt
 * Conforme a SPEC-15 (pkg/tracer)
 */

import { GeoCoordinate, Alignment } from '../types.js';
import { createAlignment } from '../alignment.js';

export interface TxtImportOptions {
  id?: string;
  name?: string;
  color?: string;
  description?: string;
}

/**
 * Parsea un archivo de texto con coordenadas de alineamiento vial.
 * Soporta comentarios iniciados por '#', encabezados de columnas (ej. index,longitude,latitude...),
 * y filas con separadores por coma, espacio o tabulación.
 */
export function parseTxtAlignment(content: string, options?: TxtImportOptions): Alignment {
  if (!content || !content.trim()) {
    throw new Error('El contenido del archivo .txt está vacío.');
  }

  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const coordinates: GeoCoordinate[] = [];

  let detectedName: string | undefined = options?.name;
  let detectedId: string | undefined = options?.id;

  let lonIdx = -1;
  let latIdx = -1;
  let hasHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extraer metadatos de comentarios
    if (line.startsWith('#')) {
      const matchName = line.match(/(?:Nombre|Name|Descripcion)\s*:\s*(.+)$/i);
      if (matchName && !detectedName) {
        detectedName = matchName[1].trim();
      }
      const matchId = line.match(/(?:Trazo|Ruta|Route|ID|Alineamiento|Codigo)(?:\s+de\s+Alineamiento\s+Vial)?\s*:\s*(.+)$/i);
      if (matchId && !detectedId) {
        detectedId = matchId[1].trim();
      }
      continue;
    }

    // Detectar encabezado
    const tokens = line.split(/[,\t]+/).map(t => t.trim());
    const lowerTokens = tokens.map(t => t.toLowerCase());

    if (!hasHeader && (lowerTokens.includes('longitude') || lowerTokens.includes('lon') || lowerTokens.includes('x'))) {
      hasHeader = true;
      lonIdx = lowerTokens.findIndex(t => t === 'longitude' || t === 'lon' || t === 'x');
      latIdx = lowerTokens.findIndex(t => t === 'latitude' || t === 'lat' || t === 'y');
      continue;
    }

    if (!hasHeader && (lowerTokens.includes('latitude') || lowerTokens.includes('lat') || lowerTokens.includes('y'))) {
      hasHeader = true;
      latIdx = lowerTokens.findIndex(t => t === 'latitude' || t === 'lat' || t === 'y');
      lonIdx = lowerTokens.findIndex(t => t === 'longitude' || t === 'lon' || t === 'x');
      continue;
    }

    // Procesar fila de datos
    let lon: number | null = null;
    let lat: number | null = null;

    if (hasHeader && lonIdx !== -1 && latIdx !== -1) {
      if (tokens.length > Math.max(lonIdx, latIdx)) {
        lon = parseFloat(tokens[lonIdx]);
        lat = parseFloat(tokens[latIdx]);
      }
    } else {
      // Línea sin encabezado previo: detectar números
      const numbers = tokens
        .map(t => parseFloat(t))
        .filter(n => !isNaN(n));

      if (numbers.length >= 2) {
        // En Perú y WGS84: longitud está entre -85 y -65, latitud entre -20 y 1
        const n0 = numbers[0];
        const n1 = numbers[1];

        if (n0 < -50 && n1 > -30 && n1 < 10) {
          lon = n0;
          lat = n1;
        } else if (n1 < -50 && n0 > -30 && n0 < 10) {
          lat = n0;
          lon = n1;
        } else {
          // Asumir por defecto [lon, lat]
          lon = n0;
          lat = n1;
        }
      }
    }

    if (lon !== null && lat !== null && !isNaN(lon) && !isNaN(lat)) {
      coordinates.push({ longitude: lon, latitude: lat });
    }
  }

  if (coordinates.length < 2) {
    throw new Error('El archivo .txt no contiene al menos 2 coordenadas geográficas válidas.');
  }

  const alignmentId = detectedId || options?.id || `ALIGNMENT-TXT-${Date.now()}`;
  const alignmentName = detectedName || options?.name || `Trazo ${alignmentId}`;

  return createAlignment(coordinates, alignmentId, alignmentName, {
    description: options?.description,
    color: options?.color
  });
}
