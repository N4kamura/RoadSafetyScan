/**
 * Importador de Alineamientos en formato GeoJSON
 * Conforme a SPEC-02 (pkg/tracer)
 */

import { GeoCoordinate, Alignment } from '../types.js';
import { createAlignment } from '../alignment.js';

export interface GeoJsonImportOptions {
  alignmentId?: string;
  alignmentName?: string;
}

/**
 * Parsea un contenido GeoJSON (string o JSON object) y construye una instancia de Alignment
 *
 * @param input Objeto GeoJSON o cadena JSON
 * @param options Opciones de metadatos (id, name)
 * @returns Instancia validada de Alignment
 */
export function parseGeoJsonAlignment(
  input: string | Record<string, unknown>,
  options?: GeoJsonImportOptions
): Alignment {
  let geojson: any;

  if (typeof input === 'string') {
    try {
      geojson = JSON.parse(input);
    } catch (err: any) {
      throw new Error(`Error al parsear cadena GeoJSON: ${err.message}`);
    }
  } else {
    geojson = input;
  }

  if (!geojson || typeof geojson !== 'object') {
    throw new Error('El objeto GeoJSON es inválido o está vacío.');
  }

  // Extraer feature o geometría
  let lineCoordinates: [number, number, number?][] | null = null;
  let detectedName: string | undefined = options?.alignmentName;
  let detectedId: string | undefined = options?.alignmentId;

  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    // Buscar la primera Feature con geometría LineString o MultiLineString
    for (const feature of geojson.features) {
      if (feature && feature.geometry) {
        if (feature.geometry.type === 'LineString' && Array.isArray(feature.geometry.coordinates)) {
          lineCoordinates = feature.geometry.coordinates;
          if (!detectedName && feature.properties?.name) {
            detectedName = String(feature.properties.name);
          }
          if (!detectedId && (feature.properties?.id || feature.id)) {
            detectedId = String(feature.properties?.id || feature.id);
          }
          break;
        } else if (feature.geometry.type === 'MultiLineString' && Array.isArray(feature.geometry.coordinates)) {
          // Seleccionar la línea con mayor cantidad de vértices
          let maxCoords: [number, number][] = [];
          for (const line of feature.geometry.coordinates) {
            if (Array.isArray(line) && line.length > maxCoords.length) {
              maxCoords = line;
            }
          }
          lineCoordinates = maxCoords;
          break;
        }
      }
    }
  } else if (geojson.type === 'Feature' && geojson.geometry) {
    if (geojson.geometry.type === 'LineString' && Array.isArray(geojson.geometry.coordinates)) {
      lineCoordinates = geojson.geometry.coordinates;
      if (!detectedName && geojson.properties?.name) {
        detectedName = String(geojson.properties.name);
      }
      if (!detectedId && (geojson.properties?.id || geojson.id)) {
        detectedId = String(geojson.properties?.id || geojson.id);
      }
    }
  } else if (geojson.type === 'LineString' && Array.isArray(geojson.coordinates)) {
    lineCoordinates = geojson.coordinates;
  }

  if (!lineCoordinates || lineCoordinates.length === 0) {
    throw new Error(
      'No se encontró ninguna geometría LineString válida en el archivo GeoJSON provisto.'
    );
  }

  // Convertir a GeoCoordinate[]
  const coordinates: GeoCoordinate[] = lineCoordinates.map((coord, index) => {
    if (!Array.isArray(coord) || coord.length < 2) {
      throw new Error(`Vértice ${index} inválido en coordenadas GeoJSON: ${JSON.stringify(coord)}`);
    }

    const lon = Number(coord[0]);
    const lat = Number(coord[1]);
    const elevation = coord.length >= 3 ? Number(coord[2]) : undefined;

    if (isNaN(lon) || isNaN(lat)) {
      throw new Error(`Coordenadas NaN detectadas en el vértice ${index}.`);
    }

    return {
      longitude: lon,
      latitude: lat,
      elevation: isNaN(elevation as number) ? undefined : elevation
    };
  });

  return createAlignment(coordinates, detectedId, detectedName);
}
