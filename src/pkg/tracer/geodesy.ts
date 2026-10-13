/**
 * Algoritmos Geodésicos y Formateo de Progresivas Viales
 * Conforme a SPEC-02 (pkg/tracer) y estándar MTC DG-2018 (Perú)
 */

import { GeoCoordinate } from './types.js';

/** Radio medio de la Tierra (IUGG) en metros */
export const EARTH_RADIUS_METERS = 6371008.8;

/** Conversión de grados a radianes */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Conversión de radianes a grados */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calcula la distancia geodésica entre dos puntos en la superficie terrestre
 * utilizando la fórmula del semiverseno (Haversine).
 *
 * @param coord1 Coordenada de origen { longitude, latitude }
 * @param coord2 Coordenada de destino { longitude, latitude }
 * @returns Distancia geodésica en metros
 */
export function haversineDistance(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
  const lon1 = coord1.longitude;
  const lat1 = coord1.latitude;
  const lon2 = coord2.longitude;
  const lat2 = coord2.latitude;

  if (lon1 === lon2 && lat1 === lat2) {
    return 0;
  }

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calcula el azimut geodésico inicial (rumbo) entre dos coordenadas.
 *
 * @param origin Coordenada inicial
 * @param destination Coordenada final
 * @returns Azimut geodésico en grados en el rango [0, 360)
 */
export function geodesicAzimuth(origin: GeoCoordinate, destination: GeoCoordinate): number {
  const lon1 = origin.longitude;
  const lat1 = origin.latitude;
  const lon2 = destination.longitude;
  const lat2 = destination.latitude;

  if (lon1 === lon2 && lat1 === lat2) {
    return 0;
  }

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaLambda = toRadians(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const initialBearingRadians = Math.atan2(y, x);
  const degrees = toDegrees(initialBearingRadians);

  // Normalizar a [0, 360)
  return (degrees + 360) % 360;
}

/**
 * Formatea una distancia longitudinal métrica en la notación oficial
 * de progresivas de carreteras de Perú (MTC Manual DG-2018):
 *
 * "km K+PPP.PP"
 *
 * Ejemplos:
 *  - 0 m -> "km 0+000.00"
 *  - 345.8 m -> "km 0+345.80"
 *  - 14520.12 m -> "km 14+520.12"
 *
 * @param meters Distancia métrica acumulada desde el inicio (S)
 * @returns Cadena formateada de progresiva vial
 */
export function formatStation(meters: number): string {
  if (meters < 0) {
    // Si la estación es negativa (ej. prolongación anterior)
    const positiveFormatted = formatStation(Math.abs(meters));
    return `-${positiveFormatted}`;
  }

  // Redondear a 2 decimales para evitar artefactos de coma flotante
  const rounded = Math.round(meters * 100) / 100;
  const km = Math.floor(rounded / 1000);
  const remainder = rounded - km * 1000;

  // Formatear el residuo con 2 decimales y relleno de ceros a 6 caracteres (ej. "005.20", "120.00")
  const formattedRemainder = remainder.toFixed(2).padStart(6, '0');

  return `km ${km}+${formattedRemainder}`;
}

/**
 * Parsea una cadena de estación ("km K+PPP.PP") de vuelta a metros.
 *
 * @param stationStr Cadena en formato "km K+PPP.PP"
 * @returns Distancia en metros
 */
export function parseStation(stationStr: string): number {
  const match = stationStr.trim().match(/^(-)?km\s*(\d+)\+(\d+(\.\d+)?)$/i);
  if (!match) {
    throw new Error(`Formato de estación inválido: "${stationStr}". Esperado "km K+PPP.PP"`);
  }

  const isNegative = Boolean(match[1]);
  const km = parseInt(match[2], 10);
  const remainder = parseFloat(match[3]);

  const total = km * 1000 + remainder;
  return isNegative ? -total : total;
}
