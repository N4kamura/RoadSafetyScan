/**
 * Store Reactivo Central y Bus de Eventos para RoadSafetyScan
 * Conforme a SPEC-04 (pkg/viz)
 */

import { Alignment } from '../tracer/types.js';
import { CrashPoint, SeverityLevel, CrashType } from '../lrs/types.js';
import { analyzeLrs } from '../lrs/aggregator.js';
import {
  VizStoreState,
  VizConfig,
  FilterState,
  SelectionState,
  VizEvent,
  VizSubscriber,
  MetricMode,
  TimeRange
} from './types.js';

export const DEFAULT_FILTERS: FilterState = {
  severities: [
    SeverityLevel.FATAL,
    SeverityLevel.LESIONES_GRAVES,
    SeverityLevel.LESIONES_LEVES,
    SeverityLevel.SOLO_DANOS
  ],
  types: [
    CrashType.CHOQUE,
    CrashType.ATROPELLO,
    CrashType.VOLCADURA,
    CrashType.DESPISTE,
    CrashType.CAIDA_PASAJERO,
    CrashType.INCENDIO,
    CrashType.OTRO
  ],
  selectedYears: undefined,
  timeRange: null
};

export const DEFAULT_VIZ_CONFIG: VizConfig = {
  bufferWidthMeters: 25,
  binSizeMeters: 100,
  metricMode: 'COUNT',
  curvilinearOffsetMeters: 1200,
  curvilinearSide: 'RIGHT',
  curvilinearHeightScale: 40
};

export const INITIAL_SELECTION: SelectionState = {
  hoveredBinIndex: null,
  selectedBinIndex: null,
  hoveredCrashId: null,
  selectedCrashId: null,
  highlightedStationRange: null
};

export class VizStore {
  private state: VizStoreState;
  private subscribers: Set<VizSubscriber> = new Set();

  constructor(initialAlignment?: Alignment, initialCrashes: CrashPoint[] = []) {
    this.state = {
      alignment: initialAlignment || null,
      allCrashes: initialCrashes,
      filteredCrashes: [],
      config: { ...DEFAULT_VIZ_CONFIG },
      filters: { ...DEFAULT_FILTERS },
      lrsResults: null,
      selection: { ...INITIAL_SELECTION }
    };

    this.recomputeFilteredCrashes();
    if (this.state.alignment) {
      this.recalculateLrs();
    }
  }

  public getState(): Readonly<VizStoreState> {
    return this.state;
  }

  public subscribe(subscriber: VizSubscriber): () => void {
    this.subscribers.add(subscriber);
    // Emitir estado inicial al nuevo suscriptor
    subscriber(this.state, { type: 'CONFIG_UPDATED', timestamp: performance.now() });

    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  private emit(event: VizEvent): void {
    for (const sub of this.subscribers) {
      try {
        sub(this.state, event);
      } catch (err) {
        console.error('Error en suscriptor VizStore:', err);
      }
    }
  }

  public setAlignment(alignment: Alignment | null): void {
    this.state.alignment = alignment;
    this.recalculateLrs();
    this.emit({ type: 'ALIGNMENT_CHANGED', payload: alignment, timestamp: performance.now() });
  }

  public setCrashes(crashes: CrashPoint[]): void {
    this.state.allCrashes = crashes;
    this.recomputeFilteredCrashes();
    this.recalculateLrs();
    this.emit({ type: 'CRASHES_LOADED', payload: crashes, timestamp: performance.now() });
  }

  public updateConfig(configUpdate: Partial<VizConfig>): void {
    this.state.config = { ...this.state.config, ...configUpdate };
    this.recalculateLrs();
    this.emit({ type: 'CONFIG_UPDATED', payload: this.state.config, timestamp: performance.now() });
  }

  public updateFilters(filtersUpdate: Partial<FilterState>): void {
    this.state.filters = { ...this.state.filters, ...filtersUpdate };
    this.recomputeFilteredCrashes();
    this.recalculateLrs();
    this.emit({ type: 'FILTERS_UPDATED', payload: this.state.filters, timestamp: performance.now() });
  }

  public setTimeRange(timeRange: TimeRange | null): void {
    this.updateFilters({ timeRange });
  }

  /**
   * SPEC-13: Obtiene la lista de años únicos disponibles en el dataset actual, ordenados descendente.
   */
  public getAvailableYears(): number[] {
    const years = new Set<number>();
    for (const crash of this.state.allCrashes) {
      const y = crash.year ?? (crash.timestamp ? new Date(crash.timestamp).getUTCFullYear() : undefined);
      if (y !== undefined && !isNaN(y)) {
        years.add(y);
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }

  /**
   * SPEC-13: Actualiza los años seleccionados en el filtro.
   */
  public setSelectedYears(selectedYears?: number[]): void {
    this.updateFilters({ selectedYears });
  }

  public hoverBin(binIndex: number | null): void {
    this.state.selection.hoveredBinIndex = binIndex;

    if (binIndex !== null && this.state.lrsResults && this.state.lrsResults.bins[binIndex]) {
      const bin = this.state.lrsResults.bins[binIndex];
      this.state.selection.highlightedStationRange = [
        bin.startChainageMeters,
        bin.endChainageMeters
      ];
    } else if (this.state.selection.selectedBinIndex === null) {
      this.state.selection.highlightedStationRange = null;
    }

    this.emit({ type: 'BIN_HOVER', payload: binIndex, timestamp: performance.now() });
  }

  public selectBin(binIndex: number | null): void {
    this.state.selection.selectedBinIndex = binIndex;

    if (binIndex !== null && this.state.lrsResults && this.state.lrsResults.bins[binIndex]) {
      const bin = this.state.lrsResults.bins[binIndex];
      this.state.selection.highlightedStationRange = [
        bin.startChainageMeters,
        bin.endChainageMeters
      ];
    } else {
      this.state.selection.highlightedStationRange = null;
    }

    this.emit({ type: 'BIN_SELECT', payload: binIndex, timestamp: performance.now() });
  }

  public hoverCrash(crashId: string | number | null): void {
    this.state.selection.hoveredCrashId = crashId;

    if (crashId !== null && this.state.lrsResults) {
      const proj = this.state.lrsResults.projectedCrashes.find(
        (p) => String(p.crash.id) === String(crashId)
      );

      if (proj) {
        // Encontrar el bin que contiene la progresiva de este siniestro
        const binIdx = Math.floor(proj.chainageMeters / this.state.config.binSizeMeters);
        this.state.selection.hoveredBinIndex = binIdx;
        this.state.selection.highlightedStationRange = [
          Math.max(0, proj.chainageMeters - 15),
          proj.chainageMeters + 15
        ];
      }
    } else if (this.state.selection.selectedBinIndex === null) {
      this.state.selection.hoveredBinIndex = null;
      this.state.selection.highlightedStationRange = null;
    }

    this.emit({ type: 'CRASH_HOVER', payload: crashId, timestamp: performance.now() });
  }

  public selectCrash(crashId: string | number | null): void {
    this.state.selection.selectedCrashId = crashId;

    if (crashId !== null && this.state.lrsResults) {
      const proj = this.state.lrsResults.projectedCrashes.find(
        (p) => String(p.crash.id) === String(crashId)
      );

      if (proj) {
        const binIdx = Math.floor(proj.chainageMeters / this.state.config.binSizeMeters);
        this.state.selection.selectedBinIndex = binIdx;
        this.state.selection.highlightedStationRange = [
          Math.max(0, proj.chainageMeters - 15),
          proj.chainageMeters + 15
        ];
      }
    }

    this.emit({ type: 'CRASH_SELECT', payload: crashId, timestamp: performance.now() });
  }

  public clearSelection(): void {
    this.state.selection = { ...INITIAL_SELECTION };
    this.emit({ type: 'SELECTION_CLEARED', timestamp: performance.now() });
  }

  private recomputeFilteredCrashes(): void {
    const { severities, types, startYear, endYear, selectedYears, timeRange } = this.state.filters;
    const sevSet = new Set(severities);
    const typeSet = new Set(types);
    const yearSet = selectedYears !== undefined ? new Set(selectedYears) : null;

    this.state.filteredCrashes = this.state.allCrashes.filter((crash) => {
      if (!sevSet.has(crash.severity)) return false;
      if (!typeSet.has(crash.type)) return false;

      // SPEC-13: Filtrado por Años Seleccionados
      const crashYear = crash.year ?? (crash.timestamp ? new Date(crash.timestamp).getUTCFullYear() : undefined);
      if (yearSet !== null) {
        if (crashYear === undefined || !yearSet.has(crashYear)) return false;
      } else {
        if (crashYear !== undefined) {
          if (startYear !== undefined && crashYear < startYear) return false;
          if (endYear !== undefined && crashYear > endYear) return false;
        }
      }

      if (timeRange && crash.timestamp) {
        const d = new Date(crash.timestamp);
        // Usar hora local o UTC de forma consistente (UTC dado formato ISO)
        const crashMinutes = d.getUTCHours() * 60 + d.getUTCMinutes();
        const { startMinute, endMinute } = timeRange;
        if (startMinute <= endMinute) {
          if (crashMinutes < startMinute || crashMinutes > endMinute) return false;
        } else {
          // Ventana que cruza la medianoche (ej. 23:21 a 18:00)
          if (crashMinutes < startMinute && crashMinutes > endMinute) return false;
        }
      }
      return true;
    });
  }

  private recalculateLrs(): void {
    if (!this.state.alignment) {
      this.state.lrsResults = null;
      return;
    }

    this.state.lrsResults = analyzeLrs(
      this.state.alignment,
      this.state.filteredCrashes,
      {
        bufferWidthMeters: this.state.config.bufferWidthMeters,
        binSizeMeters: this.state.config.binSizeMeters
      }
    );

    this.emit({
      type: 'LRS_RECALCULATED',
      payload: this.state.lrsResults,
      timestamp: performance.now()
    });
  }
}
