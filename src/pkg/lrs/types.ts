/**
 * Modelos de datos y tipos para el Motor de Referenciación Lineal (pkg/lrs)
 * Conforme a SPEC-03
 */

import { Alignment, AlignmentSegment } from '../tracer/types.js';

export enum SeverityLevel {
  FATAL = 'FATAL',
  LESIONES_GRAVES = 'LESIONES_GRAVES',
  LESIONES_LEVES = 'LESIONES_LEVES',
  SOLO_DANOS = 'SOLO_DANOS'
}

export enum CrashType {
  CHOQUE = 'CHOQUE',
  ATROPELLO = 'ATROPELLO',
  VOLCADURA = 'VOLCADURA',
  DESPISTE = 'DESPISTE',
  CAIDA_PASAJERO = 'CAIDA_PASAJERO',
  INCENDIO = 'INCENDIO',
  OTRO = 'OTRO'
}

export interface CrashPoint {
  id: string | number;
  coordinates: [longitude: number, latitude: number]; // WGS84 EPSG:4326 [lon, lat]
  timestamp?: string;                                 // ISO 8601
  year?: number;
  severity: SeverityLevel;
  type: CrashType;
  vehicles?: string[];
  roadCode?: string;
  environmentalCondition?: string;
  rawProperties?: Record<string, unknown>;
}

export enum RoadSide {
  LEFT = 'LEFT',       // Margen izquierda según sentido de circulación del eje
  RIGHT = 'RIGHT',     // Margen derecha según sentido de circulación del eje
  CENTER = 'CENTER'    // Exactamente sobre el eje (|D_perp| <= 0.05 m)
}

export interface ProjectedCrash {
  crash: CrashPoint;
  segmentIndex: number;
  projectionPoint: [longitude: number, latitude: number]; // Punto proyectado en el eje
  chainageMeters: number;                                 // S_i en metros
  stationFormatted: string;                               // Formato MTC 'km K+PPP.PP'
  lateralDistanceMeters: number;                          // |D_perp| absoluto en metros
  signedLateralDistanceMeters: number;                    // D_perp con signo (+ derecha, - izquierda)
  side: RoadSide;
  isInsideBuffer: boolean;
}

export interface LrsBinAggregate {
  binIndex: number;
  startChainageMeters: number;
  endChainageMeters: number;
  startStationFormatted: string;
  endStationFormatted: string;
  crashes: ProjectedCrash[];
  totalCount: number;
  severityCounts: Record<SeverityLevel, number>;
  typeCounts: Record<CrashType, number>;
  epdoScore: number;                                     // Índice de Severidad Ponderada (EPDO)
  densityPerKm: number;                                  // Siniestros normalizados por kilómetro
}

export interface EpdoWeights {
  fatal: number;       // Default: 9.5 (Fallecido)
  grave: number;       // Default: 3.5 (Lesiones graves)
  leve: number;        // Default: 1.0 (Lesiones leves)
  soloDanos: number;   // Default: 1.0 (Solo daños materiales)
}

export interface LrsEngineOptions {
  bufferWidthMeters?: number;     // Ancho de buffer transversal (default: 25 m)
  binSizeMeters?: number;         // Tamaño de intervalo métrico (default: 100 m)
  epdoWeights?: Partial<EpdoWeights>;
}

export interface LrsAnalysisResult {
  alignmentId: string;
  alignmentName: string;
  totalLengthMeters: number;
  totalInputCrashes: number;
  projectedInsideBufferCount: number;
  projectedOutsideBufferCount: number;
  projectedCrashes: ProjectedCrash[];
  bins: LrsBinAggregate[];
  executionTimeMs: number;
}
