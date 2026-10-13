/**
 * Tipos y Modelos de Datos para el Perfil Curvilíneo en Mapa ("Profiles along a line")
 * Conforme a SPEC-06 (pkg/curvilinear) - Paradigma VisQuill GDK A1 Collision Density
 */

export interface CurvilinearProfileOptions {
  /** Desplazamiento lateral de la línea base respecto a la carretera en metros (default: 1200 m) */
  offsetDistanceMeters: number;

  /** Margen hacia el cual se desplaza el perfil: 'RIGHT' (derecha/este) o 'LEFT' (izquierda/oeste) */
  side: 'LEFT' | 'RIGHT';

  /** Factor de escala de extrusión ortogonal (metros en el mapa por cada unidad de valor, default: 40 m/unidad) */
  heightScaleMetersPerUnit: number;

  /** Marcas de graduación para isolíneas concéntricas de escala (default: [20, 40, 60, 80]) */
  scaleTicks: number[];

  /** Tamaño de ventana de suavizado para los vectores normales (default: 3) */
  smoothingWindowSize: number;

  /** Modo métrico del histograma: 'COUNT', 'EPDO' o 'DENSITY_KM' (default: 'COUNT') */
  metricMode?: 'COUNT' | 'EPDO' | 'DENSITY_KM';
}

export interface CurvilinearBarFeature {
  binIndex: number;
  startChainageMeters: number;
  endChainageMeters: number;
  startStationFormatted: string;
  endStationFormatted: string;
  value: number;
  heightMeters: number;
  /** Coordenadas WGS84 [lon, lat] del polígono cerrado de 4 vértices */
  polygonCoordinates: [number, number][];
  severityBreakdown: {
    fatal: number;
    grave: number;
    leve: number;
    danos: number;
  };
}

export interface CurvilinearIsolineFeature {
  tickValue: number;
  heightMeters: number;
  /** Coordenadas WGS84 [lon, lat] de la curva guía continua */
  lineCoordinates: [number, number][];
  labelPosition: [number, number];
  labelRotationDegrees: number;
}

export interface CurvilinearProfileModel {
  alignmentId: string;
  /** Coordenadas de la línea base desplazada */
  baselineCoordinates: [number, number][];
  /** Barras del histograma ortogonal */
  bars: CurvilinearBarFeature[];
  /** Isolíneas curvas concéntricas de escala */
  isolines: CurvilinearIsolineFeature[];
  /** Líneas transversales conectoras de extremos */
  connectorLines: [number, number][][];
}
