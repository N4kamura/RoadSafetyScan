/**
 * Tipos y Modelos para el Visualizador y Store Reactivo
 * Conforme a SPEC-04 (pkg/viz)
 */

import { Alignment } from '../tracer/types.js';
import { CrashPoint, LrsAnalysisResult, SeverityLevel, CrashType, PersonsBreakdown } from '../lrs/types.js';

export { SeverityLevel, CrashType } from '../lrs/types.js';
export type { PersonsBreakdown } from '../lrs/types.js';

export const VISQUILL_ATTRIBUTION = 'Visualización de perfil longitudinal impulsada por VisQuill GDK.';

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  [SeverityLevel.FATAL]: '#DC2626',           // Rojo intenso
  [SeverityLevel.LESIONES_GRAVES]: '#EA580C',  // Naranja ámbar
  [SeverityLevel.LESIONES_LEVES]: '#FACC15',    // Amarillo canario
  [SeverityLevel.SOLO_DANOS]: '#2563EB'        // Azul acero
};

// SPEC-14: Colores para categorías de GRAVEDAD de Personas y Vehículos
export const PERSON_GRAVEDAD_COLORS = {
  fallecido: '#DC2626',   // Rojo MTC
  lesionado: '#EA580C',   // Naranja ámbar
  noSeConoce: '#94A3B8',  // Gris neutro
  ileso: '#10B981'        // Verde esmeralda
};

export const VEHICLE_COLOR = '#0284C7'; // Azul cielo / turquesa vial

export const HIGHLIGHT_COLOR = '#10B981'; // Verde esmeralda neón
export const BUFFER_FILL_COLOR = '#0284C7'; // Azul cielo translúcido

export type MetricMode = 'COUNT' | 'VEHICLES' | 'PERSONS' | 'EPDO' | 'DENSITY_KM';

export interface TimeRange {
  startMinute: number; // 0 a 1439 minutos desde 00:00
  endMinute: number;   // 0 a 1439 minutos desde 00:00
}

export interface FilterState {
  severities: SeverityLevel[];
  types: CrashType[];
  startYear?: number;
  endYear?: number;
  selectedYears?: number[]; // SPEC-13: Años seleccionados explícitamente para filtrado multianual
  timeRange?: TimeRange | null;
}

export interface SelectionState {
  hoveredBinIndex: number | null;
  selectedBinIndex: number | null;
  hoveredCrashId: string | number | null;
  selectedCrashId: string | number | null;
  highlightedStationRange: [number, number] | null; // [startMeters, endMeters]
}

export interface VizConfig {
  bufferWidthMeters: number;
  binSizeMeters: number;
  metricMode: MetricMode;
  curvilinearOffsetMeters: number;
  curvilinearSide: 'LEFT' | 'RIGHT';
  curvilinearHeightScale: number;
}

export interface VizStoreState {
  alignment: Alignment | null;
  allCrashes: CrashPoint[];
  filteredCrashes: CrashPoint[];
  config: VizConfig;
  filters: FilterState;
  lrsResults: LrsAnalysisResult | null;
  selection: SelectionState;
}

export type VizEventType = 
  | 'ALIGNMENT_CHANGED'
  | 'CRASHES_LOADED'
  | 'CONFIG_UPDATED'
  | 'FILTERS_UPDATED'
  | 'LRS_RECALCULATED'
  | 'BIN_HOVER'
  | 'BIN_SELECT'
  | 'CRASH_HOVER'
  | 'CRASH_SELECT'
  | 'SELECTION_CLEARED';

export interface VizEvent {
  type: VizEventType;
  payload?: any;
  timestamp: number;
}

export type VizSubscriber = (state: VizStoreState, event: VizEvent) => void;
