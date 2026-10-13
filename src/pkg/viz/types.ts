/**
 * Tipos y Modelos para el Visualizador y Store Reactivo
 * Conforme a SPEC-04 (pkg/viz)
 */

import { Alignment } from '../tracer/types.js';
import { CrashPoint, LrsAnalysisResult, SeverityLevel, CrashType } from '../lrs/types.js';

export { SeverityLevel, CrashType } from '../lrs/types.js';

export const VISQUILL_ATTRIBUTION = 'Visualización de perfil longitudinal impulsada por VisQuill GDK.';

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  [SeverityLevel.FATAL]: '#DC2626',           // Rojo intenso
  [SeverityLevel.LESIONES_GRAVES]: '#EA580C',  // Naranja ámbar
  [SeverityLevel.LESIONES_LEVES]: '#FACC15',    // Amarillo canario
  [SeverityLevel.SOLO_DANOS]: '#2563EB'        // Azul acero
};

export const HIGHLIGHT_COLOR = '#10B981'; // Verde esmeralda neón
export const BUFFER_FILL_COLOR = '#0284C7'; // Azul cielo translúcido

export type MetricMode = 'COUNT' | 'EPDO' | 'DENSITY_KM';

export interface FilterState {
  severities: SeverityLevel[];
  types: CrashType[];
  startYear?: number;
  endYear?: number;
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
