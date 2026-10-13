/**
 * Controlador del Panel Lateral de Parámetros y Exportación
 * Conforme a SPEC-04, SPEC-05 y SPEC-06
 */

import { VizStore } from '../pkg/viz/store.js';
import { SeverityLevel, MetricMode } from '../pkg/viz/types.js';
import {
  generateCsvProfileReport,
  generateProjectedCrashesGeoJson,
  generateCorridorBinsGeoJson,
  triggerBrowserDownload
} from '../pkg/export/index.js';
import { parseGeoJsonAlignment } from '../pkg/tracer/importers/geojson.js';
import { createAlignment } from '../pkg/tracer/alignment.js';
import {
  MOCK_ALIGNMENT_DATA,
  MOCK_CRASHES_DATA,
  MOCK_ALIGNMENT_NORTE_DATA,
  MOCK_CRASHES_NORTE_DATA
} from '../mock-data.js';

export class SidebarController {
  private store: VizStore;

  constructor(store: VizStore) {
    this.store = store;
    this.initCorridorSelector();
    this.initControls();
    this.initCurvilinearControls();
    this.initFloatingMapControls();
    this.initYearFilterControls();
    this.initExportButtons();
    this.initFileLoader();

    // Actualizar KPIs al re-calcular LRS
    this.store.subscribe((state, event) => {
      if (
        event.type === 'LRS_RECALCULATED' ||
        event.type === 'CONFIG_UPDATED' ||
        event.type === 'FILTERS_UPDATED' ||
        event.type === 'ALIGNMENT_CHANGED'
      ) {
        this.updateKpis();
      }

      if (event.type === 'CRASHES_LOADED') {
        this.renderYearChips();
      } else if (event.type === 'FILTERS_UPDATED') {
        this.syncYearCheckboxes(state.filters.selectedYears);
      }

      if (event.type === 'CONFIG_UPDATED') {
        const scaleVal = document.getElementById('val-curv-scale');
        if (scaleVal) {
          scaleVal.textContent = `${state.config.curvilinearHeightScale} m/u`;
        }
      }
    });

    this.updateKpis();
  }

  private initCorridorSelector(): void {
    const selector = document.getElementById('select-corridor-trace') as HTMLSelectElement;
    const btnCalc = document.getElementById('btn-run-calculation');
    const headerBadge = document.getElementById('header-corridor-badge');

    const loadCorridor = (code: string) => {
      if (code === 'PE-1S') {
        const coords = MOCK_ALIGNMENT_DATA.coordinates.map((c: number[]) => ({
          longitude: c[0],
          latitude: c[1]
        }));
        const alignment = createAlignment(coords, MOCK_ALIGNMENT_DATA.id, MOCK_ALIGNMENT_DATA.name);
        this.store.setAlignment(alignment);
        this.store.setCrashes(MOCK_CRASHES_DATA);
        if (headerBadge) headerBadge.textContent = 'PE-1S: Panamericana Sur (Km 18 al 25)';
      } else if (code === 'PE-1N') {
        const coords = MOCK_ALIGNMENT_NORTE_DATA.coordinates.map((c: number[]) => ({
          longitude: c[0],
          latitude: c[1]
        }));
        const alignment = createAlignment(coords, MOCK_ALIGNMENT_NORTE_DATA.id, MOCK_ALIGNMENT_NORTE_DATA.name);
        this.store.setAlignment(alignment);
        this.store.setCrashes(MOCK_CRASHES_NORTE_DATA);
        if (headerBadge) headerBadge.textContent = 'PE-1N: Panamericana Norte (Km 35 al 41)';
      } else if (code === 'CUSTOM') {
        const fileInput = document.getElementById('file-input-alignment') as HTMLInputElement;
        if (fileInput) fileInput.click();
      }

      if ((window as any).mapInstance && typeof (window as any).mapInstance.fitBounds === 'function') {
        const btnFit = document.getElementById('btn-fit-map');
        if (btnFit) btnFit.click();
      }
    };

    if (selector) {
      selector.addEventListener('change', () => {
        loadCorridor(selector.value);
      });
    }

    if (btnCalc) {
      btnCalc.addEventListener('click', () => {
        const code = selector ? selector.value : 'PE-1S';
        loadCorridor(code);
        const originalText = btnCalc.textContent;
        btnCalc.textContent = '✓ ¡Auditoría Calculada!';
        btnCalc.style.backgroundColor = '#16a34a';
        setTimeout(() => {
          btnCalc.textContent = originalText || '⚡ Calcular Auditoría Vial (LRS)';
          btnCalc.style.backgroundColor = '#2563eb';
        }, 1200);
      });
    }
  }

  private initControls(): void {
    // 1. Slider de Ancho de Buffer
    const bufferSlider = document.getElementById('slider-buffer-width') as HTMLInputElement;
    const bufferVal = document.getElementById('val-buffer-width');
    if (bufferSlider && bufferVal) {
      bufferSlider.addEventListener('input', () => {
        const val = Number(bufferSlider.value);
        bufferVal.textContent = `${val} m`;
        this.store.updateConfig({ bufferWidthMeters: val });
      });
    }

    // 2. Slider de Tamaño de Bin
    const binSlider = document.getElementById('slider-bin-size') as HTMLInputElement;
    const binVal = document.getElementById('val-bin-size');
    if (binSlider && binVal) {
      binSlider.addEventListener('input', () => {
        const val = Number(binSlider.value);
        binVal.textContent = `${val} m`;
        this.store.updateConfig({ binSizeMeters: val });
      });
    }

    // Presets rápidos de Bin Size
    document.querySelectorAll('.btn-preset-bin').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const presetVal = Number(target.getAttribute('data-bin'));
        if (presetVal && binSlider && binVal) {
          binSlider.value = String(presetVal);
          binVal.textContent = `${presetVal} m`;
          this.store.updateConfig({ binSizeMeters: presetVal });
        }
      });
    });

    // 3. Checkboxes de Severidad
    const sevCheckboxes = document.querySelectorAll<HTMLInputElement>('.filter-severity-cb');
    sevCheckboxes.forEach((cb) => {
      cb.addEventListener('change', () => {
        const activeSeverities: SeverityLevel[] = [];
        sevCheckboxes.forEach((c) => {
          if (c.checked) {
            activeSeverities.push(c.value as SeverityLevel);
          }
        });
        this.store.updateFilters({ severities: activeSeverities });
      });
    });

    // 4. Selector de Métrica (Tabs)
    const metricTabs = document.querySelectorAll<HTMLButtonElement>('.metric-tab-btn');
    metricTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const mode = tab.getAttribute('data-mode') as MetricMode;
        this.setMetricMode(mode);
      });
    });
  }

  private initCurvilinearControls(): void {
    // Slider Offset Lateral (D_offset)
    const offsetSlider = document.getElementById('slider-curv-offset') as HTMLInputElement;
    const offsetVal = document.getElementById('val-curv-offset');
    if (offsetSlider && offsetVal) {
      offsetSlider.addEventListener('input', () => {
        const val = Number(offsetSlider.value);
        offsetVal.textContent = `${val} m`;
        this.store.updateConfig({ curvilinearOffsetMeters: val });
      });
    }


    // Botones Lado de Proyección (RIGHT / LEFT)
    const sideButtons = document.querySelectorAll<HTMLButtonElement>('.btn-curv-side');
    sideButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const side = btn.getAttribute('data-side') as 'RIGHT' | 'LEFT';
        this.setCurvilinearSide(side);
      });
    });
  }

  private initFloatingMapControls(): void {
    // Pastillas flotantes sobre el mapa: Métricas
    const mapMetricPills = document.querySelectorAll<HTMLButtonElement>('.map-metric-pill');
    mapMetricPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const mode = pill.getAttribute('data-mode') as MetricMode;
        this.setMetricMode(mode);
      });
    });

    // Pastilla flotante sobre el mapa: Alternar Lado
    const toggleSideBtn = document.getElementById('btn-map-toggle-side');
    if (toggleSideBtn) {
      toggleSideBtn.addEventListener('click', () => {
        const currentSide = this.store.getState().config.curvilinearSide;
        const newSide = currentSide === 'RIGHT' ? 'LEFT' : 'RIGHT';
        this.setCurvilinearSide(newSide);
      });
    }

    // Pastillas flotantes sobre el mapa: Quick Offset
    const mapOffsetPills = document.querySelectorAll<HTMLButtonElement>('.map-offset-pill');
    mapOffsetPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const offset = Number(pill.getAttribute('data-offset'));
        if (offset) {
          const offsetSlider = document.getElementById('slider-curv-offset') as HTMLInputElement;
          const offsetVal = document.getElementById('val-curv-offset');
          if (offsetSlider) offsetSlider.value = String(offset);
          if (offsetVal) offsetVal.textContent = `${offset} m`;
          this.store.updateConfig({ curvilinearOffsetMeters: offset });

          mapOffsetPills.forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');
        }
      });
    });
  }

  private setMetricMode(mode: MetricMode): void {
    // Sincronizar clases activas en sidebar y mapa
    document.querySelectorAll('.metric-tab-btn, .map-metric-pill').forEach((el) => {
      if (el.getAttribute('data-mode') === mode) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    this.store.updateConfig({ metricMode: mode });
  }

  private setCurvilinearSide(side: 'RIGHT' | 'LEFT'): void {
    document.querySelectorAll('.btn-curv-side').forEach((el) => {
      if (el.getAttribute('data-side') === side) {
        el.classList.add('active');
        el.classList.remove('btn-outline');
        el.classList.add('btn-secondary');
      } else {
        el.classList.remove('active');
        el.classList.remove('btn-secondary');
        el.classList.add('btn-outline');
      }
    });

    const toggleSideBtn = document.getElementById('btn-map-toggle-side');
    if (toggleSideBtn) {
      toggleSideBtn.textContent = side === 'RIGHT' ? '➡️ Lado: Derecha (Este)' : '⬅️ Lado: Izquierda (Oeste)';
    }

    this.store.updateConfig({ curvilinearSide: side });
  }

  private updateKpis(): void {
    const state = this.store.getState();
    const results = state.lrsResults;

    const elTotalKm = document.getElementById('kpi-total-km');
    const elInside = document.getElementById('kpi-inside-buffer');
    const elOutside = document.getElementById('kpi-outside-buffer');
    const elTotalEpdo = document.getElementById('kpi-total-epdo');
    const elHotspot = document.getElementById('kpi-hotspot-station');

    if (!results || !state.alignment) return;

    if (elTotalKm) {
      elTotalKm.textContent = `${(results.totalLengthMeters / 1000).toFixed(2)} km`;
    }
    if (elInside) {
      elInside.textContent = String(results.projectedInsideBufferCount);
    }
    if (elOutside) {
      elOutside.textContent = String(results.projectedOutsideBufferCount);
    }

    // Calcular EPDO acumulado
    const totalEpdo = results.bins.reduce((sum, b) => sum + b.epdoScore, 0);
    if (elTotalEpdo) {
      elTotalEpdo.textContent = totalEpdo.toFixed(1);
    }

    // Localizar Hotspot (bin con mayor EPDO)
    if (results.bins.length > 0) {
      const topBin = results.bins.reduce((max, b) => (b.epdoScore > max.epdoScore ? b : max), results.bins[0]);
      if (elHotspot) {
        if (topBin.epdoScore > 0) {
          elHotspot.textContent = `${topBin.startStationFormatted} (EPDO: ${topBin.epdoScore.toFixed(1)})`;
        } else {
          elHotspot.textContent = 'Sin incidentes';
        }
      }
    }
  }

  private initExportButtons(): void {
    // Exportar CSV
    const btnCsv = document.getElementById('btn-export-csv');
    if (btnCsv) {
      btnCsv.addEventListener('click', () => {
        const results = this.store.getState().lrsResults;
        if (!results) return;
        const csv = generateCsvProfileReport(results);
        const filename = `RoadSafetyScan_Perfil_${results.alignmentId}.csv`;
        triggerBrowserDownload(csv, filename, 'text/csv;charset=utf-8;');
      });
    }

    // Exportar GeoJSON de Siniestros
    const btnGeoJsonCrashes = document.getElementById('btn-export-geojson-crashes');
    if (btnGeoJsonCrashes) {
      btnGeoJsonCrashes.addEventListener('click', () => {
        const results = this.store.getState().lrsResults;
        if (!results) return;
        const geojson = generateProjectedCrashesGeoJson(results);
        const filename = `RoadSafetyScan_Siniestros_${results.alignmentId}.geojson`;
        triggerBrowserDownload(JSON.stringify(geojson, null, 2), filename, 'application/geo+json');
      });
    }

    // Exportar GeoJSON de Tramos del Corredor
    const btnGeoJsonCorridor = document.getElementById('btn-export-geojson-corridor');
    if (btnGeoJsonCorridor) {
      btnGeoJsonCorridor.addEventListener('click', () => {
        const state = this.store.getState();
        if (!state.lrsResults || !state.alignment) return;
        const geojson = generateCorridorBinsGeoJson(state.alignment, state.lrsResults);
        const filename = `RoadSafetyScan_Corredor_${state.alignment.id}.geojson`;
        triggerBrowserDownload(JSON.stringify(geojson, null, 2), filename, 'application/geo+json');
      });
    }
  }

  private initFileLoader(): void {
    const fileInput = document.getElementById('file-input-alignment') as HTMLInputElement;
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            const newAlignment = parseGeoJsonAlignment(content, {
              alignmentName: file.name.replace(/\.[^/.]+$/, '')
            });
            this.store.setAlignment(newAlignment);
            alert(`Alineamiento "${newAlignment.name}" cargado exitosamente (${newAlignment.vertices.length} vértices, ${(newAlignment.totalLength / 1000).toFixed(2)} km).`);
          } catch (err: any) {
            alert(`Error al cargar archivo de alineamiento: ${err.message}`);
          }
        };
        reader.readAsText(file);
      });
    }
  }

  // ==========================================
  // SPEC-13: Filtro Temporal por Años
  // ==========================================

  private initYearFilterControls(): void {
    const btnAll = document.getElementById('btn-year-all');
    const btnLatest = document.getElementById('btn-year-latest');
    const btnClear = document.getElementById('btn-year-clear');

    if (btnAll) {
      btnAll.addEventListener('click', () => {
        const allYears = this.store.getAvailableYears();
        this.store.setSelectedYears(allYears);
        this.syncYearCheckboxes(allYears);
      });
    }

    if (btnLatest) {
      btnLatest.addEventListener('click', () => {
        const available = this.store.getAvailableYears();
        if (available.length > 0) {
          const latestYear = [available[0]];
          this.store.setSelectedYears(latestYear);
          this.syncYearCheckboxes(latestYear);
        }
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.store.setSelectedYears([]);
        this.syncYearCheckboxes([]);
      });
    }

    this.renderYearChips();
  }

  private renderYearChips(): void {
    const container = document.getElementById('year-checkbox-container');
    if (!container) return;

    const state = this.store.getState();
    const availableYears = this.store.getAvailableYears();
    const selectedYears = state.filters.selectedYears;

    if (availableYears.length === 0) {
      container.innerHTML = '<div style="font-size: 0.68rem; color: #94a3b8; grid-column: span 2;">Sin datos de años disponibles</div>';
      this.updateYearBadge();
      return;
    }

    // Calcular distribución de frecuencias anuales
    const countsByYear = new Map<number, number>();
    for (const crash of state.allCrashes) {
      const y = crash.year ?? (crash.timestamp ? new Date(crash.timestamp).getUTCFullYear() : undefined);
      if (y !== undefined) {
        countsByYear.set(y, (countsByYear.get(y) || 0) + 1);
      }
    }

    container.innerHTML = '';
    availableYears.forEach((year) => {
      const count = countsByYear.get(year) || 0;
      const isChecked = !selectedYears || selectedYears.includes(year);

      const item = document.createElement('label');
      item.className = `year-chip-item ${isChecked ? 'active' : ''}`;
      item.setAttribute('data-year', String(year));

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'year-chip-cb';
      cb.value = String(year);
      cb.checked = isChecked;

      cb.addEventListener('change', () => {
        this.handleYearCheckboxChange();
      });

      const labelSpan = document.createElement('span');
      labelSpan.className = 'year-chip-label';
      labelSpan.appendChild(cb);
      labelSpan.appendChild(document.createTextNode(String(year)));

      const countSpan = document.createElement('span');
      countSpan.className = 'year-chip-count';
      countSpan.textContent = String(count);

      item.appendChild(labelSpan);
      item.appendChild(countSpan);
      container.appendChild(item);
    });

    this.updateYearBadge();
  }

  private handleYearCheckboxChange(): void {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('.year-chip-cb');
    const selected: number[] = [];
    checkboxes.forEach((cb) => {
      const year = Number(cb.value);
      const parent = cb.closest('.year-chip-item');
      if (cb.checked) {
        selected.push(year);
        parent?.classList.add('active');
      } else {
        parent?.classList.remove('active');
      }
    });

    this.store.setSelectedYears(selected);
    this.updateYearBadge();
  }

  private syncYearCheckboxes(selectedYears?: number[]): void {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('.year-chip-cb');
    checkboxes.forEach((cb) => {
      const year = Number(cb.value);
      const isChecked = !selectedYears || selectedYears.includes(year);
      cb.checked = isChecked;
      const parent = cb.closest('.year-chip-item');
      if (isChecked) {
        parent?.classList.add('active');
      } else {
        parent?.classList.remove('active');
      }
    });

    this.updateYearBadge();
  }

  private updateYearBadge(): void {
    const badgeCount = document.getElementById('badge-selected-years-count');
    if (!badgeCount) return;

    const available = this.store.getAvailableYears();
    const state = this.store.getState();
    const selected = state.filters.selectedYears;

    if (!selected || selected.length === available.length) {
      badgeCount.textContent = 'Todos los años';
      badgeCount.style.color = '#2563eb';
    } else if (selected.length === 0) {
      badgeCount.textContent = 'Ninguno (0)';
      badgeCount.style.color = '#ef4444';
    } else {
      badgeCount.textContent = `${selected.length}/${available.length} años`;
      badgeCount.style.color = '#7c3aed';
    }
  }
}
