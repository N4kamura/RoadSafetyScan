/**
 * Modelos de datos y tipos para el módulo de Trazo Geométrico y Alineamiento (pkg/tracer)
 * Conforme a SPEC-02
 */

export interface GeoCoordinate {
  longitude: number; // Grados decimales WGS84 [-180, 180]
  latitude: number;  // Grados decimales WGS84 [-90, 90]
  elevation?: number; // Metros sobre el nivel del mar (opcional)
}

export interface BoundingBox {
  minX: number; // Longitud mínima
  minY: number; // Latitud mínima
  maxX: number; // Longitud máxima
  maxY: number; // Latitud máxima
}

export interface AlignmentVertex {
  index: number;
  coordinates: GeoCoordinate;
  cumulativeDistance: number; // Metros acumulados desde el inicio del trazo (S=0)
  stationFormatted: string;   // Formato MTC: 'km K+PPP.PP' (ej. 'km 0+150.00')
  segmentAzimuth?: number;    // Azimut geodésico hacia el siguiente vértice [0, 360)
}

export interface AlignmentSegment {
  index: number;
  startVertex: AlignmentVertex;
  endVertex: AlignmentVertex;
  length: number;             // Longitud geodésica del segmento en metros
  azimuth: number;            // Azimut geodésico en grados [0, 360)
  bbox: BoundingBox;
}

export type AlignmentWarningCode = 
  | 'DEGENERATE_VERTEX_REMOVED' 
  | 'SELF_INTERSECTION_DETECTED' 
  | 'SHARP_DEFLECTION_ANGLE';

export interface AlignmentWarning {
  code: AlignmentWarningCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface Alignment {
  id: string;
  name: string;
  vertices: AlignmentVertex[];
  segments: AlignmentSegment[];
  totalLength: number;        // Longitud total del eje en metros
  bbox: BoundingBox;
  warnings?: AlignmentWarning[];
}
