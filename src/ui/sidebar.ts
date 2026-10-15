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
import { generateTxtAlignmentTrace } from '../pkg/export/txt.js';
import { generateGtfsRoutesTxt, generateGtfsShapesTxt } from '../pkg/export/gtfs.js';
import { parseGeoJsonAlignment } from '../pkg/tracer/importers/geojson.js';
import { parseTxtAlignment } from '../pkg/tracer/importers/txt.js';
import { createAlignment } from '../pkg/tracer/alignment.js';
import { Alignment } from '../pkg/tracer/types.js';
import { RouteManager, ManagedRoute } from '../pkg/tracer/route-manager.js';
import { TraceDrawerController } from './trace-drawer.js';
import {
  MOCK_ALIGNMENT_DATA,
  MOCK_CRASHES_DATA
} from '../mock-data.js';

export class SidebarController {
  private store: VizStore;
  private routeManager?: RouteManager;
  private traceDrawer?: TraceDrawerController;
  private mapController?: { resize: () => void };

  constructor(
    store: VizStore,
    routeManager?: RouteManager,
    traceDrawer?: TraceDrawerController,
    mapController?: { resize: () => void }
  ) {
    this.store = store;
    this.routeManager = routeManager;
    this.traceDrawer = traceDrawer;
    this.mapController = mapController;

    this.initCorridorSelector();
    this.initTraceDrawingButtons();
    this.initRouteListManager();
    this.initControls();
    this.initCurvilinearControls();
    this.initFloatingMapControls();
    this.initPanelVisibilityControls(mapController);
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

        // SPEC-23: Sincronizar control deslizante de tamaño de bin adaptativo por zoom
        const binSlider = document.getElementById('slider-bin-size') as HTMLInputElement;
        const binVal = document.getElementById('val-bin-size');
        if (binSlider && binVal && binSlider.value !== String(state.config.binSizeMeters)) {
          binSlider.value = String(state.config.binSizeMeters);
          binVal.textContent = `${state.config.binSizeMeters} m`;
        }
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

  private initTraceDrawingButtons(): void {
    const btnHeader = document.getElementById('btn-draw-trace');
    const btnSidebar = document.getElementById('btn-draw-trace-sidebar');

    const handleStart = () => {
      if (this.traceDrawer) {
        this.traceDrawer.startDrawing();
      }
    };

    btnHeader?.addEventListener('click', handleStart);
    btnSidebar?.addEventListener('click', handleStart);
  }

  private initRouteListManager(): void {
    if (!this.routeManager) return;
    this.routeManager.subscribe((routes, primary) => {
      this.renderRouteList(routes, primary);
      this.syncCorridorSelector(routes, primary);
    });
  }

  private renderRouteList(routes: ManagedRoute[], primary: ManagedRoute | null): void {
    const container = document.getElementById('routes-manager-list');
    if (!container) return;

    container.innerHTML = '';

    for (const r of routes) {
      const card = document.createElement('div');
      card.className = `route-item-card ${r.id === primary?.id ? 'is-primary' : ''}`;

      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.route-item-actions') || target.closest('.route-visibility-cb')) {
          return;
        }
        this.routeManager?.setPrimaryRoute(r.id);
      });

      // ── Primera línea: Checkbox, Punto de color, Nombre y Longitud ──
      const header = document.createElement('div');
      header.className = 'route-item-header';

      const left = document.createElement('div');
      left.className = 'route-item-left';

      // Checkbox para activar/desactivar visibilidad en el mapa
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'route-visibility-cb';
      cb.checked = r.visibleOnMap;
      cb.title = r.visibleOnMap ? 'Ocultar ruta del mapa' : 'Mostrar ruta en el mapa';
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        this.routeManager?.toggleMapVisibility(r.id, cb.checked);
      });

      // Punto de color
      const dot = document.createElement('span');
      dot.className = 'route-color-pill';
      dot.style.backgroundColor = r.color;

      // Nombre limpio en la primera línea (sin etiqueta [EJEMPLO])
      const title = document.createElement('span');
      title.className = 'route-meta-title';
      title.textContent = r.name;
      title.title = `${r.name} (${(r.totalLengthMeters / 1000).toFixed(2)} km)`;
      title.addEventListener('click', (e) => {
        e.stopPropagation();
        this.routeManager?.setPrimaryRoute(r.id);
      });

      const len = document.createElement('span');
      len.className = 'route-meta-length';
      len.textContent = `${(r.totalLengthMeters / 1000).toFixed(2)} km`;

      left.appendChild(cb);
      left.appendChild(dot);
      left.appendChild(title);

      header.appendChild(left);
      header.appendChild(len);

      // ── Segunda línea: Botones de Acción (📥 Descargar, ✏️ Editar, 🗑️ Eliminar) ──
      const actions = document.createElement('div');
      actions.className = 'route-item-actions';

      // Botón exportar .txt (icono de descarga)
      const btnTxt = document.createElement('button');
      btnTxt.className = 'btn-route-action';
      btnTxt.textContent = '📥';
      btnTxt.title = 'Descargar trazo en formato .txt';
      btnTxt.addEventListener('click', (e) => {
        e.stopPropagation();
        const txt = generateTxtAlignmentTrace(r.alignment);
        triggerBrowserDownload(txt, `${r.id}.txt`, 'text/plain;charset=utf-8');
      });
      actions.appendChild(btnTxt);

      // Botón de Edición (icono de lápiz, sin texto)
      const isLocked = r.isLocked !== false;
      const btnLock = document.createElement('button');
      btnLock.className = `btn-route-action ${isLocked ? 'btn-route-locked' : 'btn-route-unlocked'}`;
      btnLock.innerHTML = '✏️';
      btnLock.title = isLocked
        ? `Editar vértices del trazo "${r.name}" en el mapa`
        : `Finalizar edición de "${r.name}"`;
      btnLock.style.fontSize = '0.78rem';
      btnLock.style.padding = '0.2rem 0.45rem';

      btnLock.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isLocked) {
          // Despliega advertencia de seguridad explícita (SPEC-21)
          const proceed = confirm(
            `⚠️ AVISO DE SEGURIDAD - MODIFICACIÓN DE TRAZO:\n\n` +
            `¿Estás seguro de que deseas desbloquear y editar el trazado "${r.name}"?\n\n` +
            `Al modificar los vértices se recalcularán automáticamente el cadenamiento, el motor LRS y el perfil de siniestros.\n\n` +
            `¿Deseas continuar?`
          );
          if (proceed) {
            this.routeManager?.unlockRoute(r.id);
            this.routeManager?.setPrimaryRoute(r.id);
            this.traceDrawer?.startEditingRoute(r);
          }
        } else {
          // Bloquear de nuevo
          this.routeManager?.lockRoute(r.id);
          this.traceDrawer?.cancelDrawing();
        }
      });
      actions.appendChild(btnLock);

      // Botón borrar disponible para cualquier ruta si se desea eliminar
      const btnDel = document.createElement('button');
      btnDel.className = 'btn-route-action';
      btnDel.textContent = '🗑️';
      btnDel.title = 'Eliminar trazado';
      btnDel.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`¿Deseas eliminar la ruta "${r.name}"?`)) {
          this.routeManager?.removeRoute(r.id);
        }
      });
      actions.appendChild(btnDel);

      card.appendChild(header);
      card.appendChild(actions);
      container.appendChild(card);
    }
  }

  private syncCorridorSelector(routes: ManagedRoute[], primary: ManagedRoute | null): void {
    const selector = document.getElementById('select-corridor-trace') as HTMLSelectElement;
    if (!selector) return;

    selector.innerHTML = '';

    // Opción para navegación libre sin ruta fija (SPEC-19)
    const noneOpt = document.createElement('option');
    noneOpt.value = 'NONE';
    noneOpt.textContent = '🗺️ Ninguna ruta (Exploración libre por el Perú)';
    if (!primary) {
      noneOpt.selected = true;
    }
    selector.appendChild(noneOpt);

    for (const r of routes) {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `🛣️ ${r.name}`;
      if (primary && r.id === primary.id) {
        opt.selected = true;
      }
      selector.appendChild(opt);
    }

    const customOpt = document.createElement('option');
    customOpt.value = 'CUSTOM';
    customOpt.textContent = '📂 Cargar archivo personalizado...';
    selector.appendChild(customOpt);

    const headerBadge = document.getElementById('header-corridor-badge');
    if (headerBadge) {
      headerBadge.textContent = primary
        ? primary.name
        : '🗺️ Exploración Libre (Perú)';
    }
  }

  private initCorridorSelector(): void {
    const selector = document.getElementById('select-corridor-trace') as HTMLSelectElement;

    const loadCorridor = (code: string) => {
      if (code === 'CUSTOM') {
        const fileInput = document.getElementById('file-input-alignment') as HTMLInputElement;
        if (fileInput) fileInput.click();
        return;
      }

      if (this.routeManager) {
        this.routeManager.setPrimaryRoute(code === 'NONE' ? null : code);
      }
    };

    if (selector) {
      selector.addEventListener('change', () => {
        loadCorridor(selector.value);
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

    // 4. Selector de Métrica (Tabs y Botones)
    const metricButtons = document.querySelectorAll<HTMLButtonElement>('.metric-tab-btn, .btn-metric-selector');
    metricButtons.forEach((tab) => {
      tab.addEventListener('click', () => {
        const mode = (tab.getAttribute('data-mode') || tab.getAttribute('data-metric')) as MetricMode;
        if (mode) this.setMetricMode(mode);
      });
    });

    // 5. Botón Minimizar/Restaurar Panel de Perfil Longitudinal Inferior
    const btnTogglePanel = document.getElementById('btn-toggle-profile-panel');
    const profilePanel = document.getElementById('panel-longitudinal-profile');
    if (btnTogglePanel && profilePanel) {
      btnTogglePanel.addEventListener('click', () => {
        profilePanel.classList.toggle('minimized');
        btnTogglePanel.textContent = profilePanel.classList.contains('minimized') ? '▲ Restaurar' : '▼ Minimizar';
      });
    }
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
        const mode = (pill.getAttribute('data-mode') || pill.getAttribute('data-metric')) as MetricMode;
        if (mode) this.setMetricMode(mode);
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

  /**
   * SPEC-29: Controles de visibilidad y colapso de la leyenda cartográfica y panel lateral
   */
  public initPanelVisibilityControls(mapController?: { resize: () => void }): void {
    if (mapController) {
      this.mapController = mapController;
    }

    // 1. Control de colapso de la leyenda cartográfica (#map-legend-overlay)
    const legendOverlay = document.getElementById('map-legend-overlay');
    const legendHeader = document.getElementById('legend-header');
    const btnLegendCollapse = document.getElementById('btn-legend-collapse');

    const toggleLegend = () => {
      if (!legendOverlay) return;
      const isMinimized = legendOverlay.classList.toggle('minimized');
      if (btnLegendCollapse) {
        btnLegendCollapse.textContent = isMinimized ? '▲' : '▼';
        btnLegendCollapse.title = isMinimized ? 'Expandir Leyenda' : 'Minimizar Leyenda';
        btnLegendCollapse.setAttribute('aria-label', isMinimized ? 'Expandir Leyenda' : 'Minimizar Leyenda');
      }
    };

    if (btnLegendCollapse) {
      btnLegendCollapse.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLegend();
      });
    }

    if (legendHeader) {
      legendHeader.addEventListener('click', (e) => {
        if (e.target !== btnLegendCollapse) {
          toggleLegend();
        }
      });
    }

    // 2. Control de colapso del panel lateral (.app-sidebar)
    const sidebar = document.querySelector('.app-sidebar');
    const btnToggleSidebarHeader = document.getElementById('btn-toggle-sidebar');
    const btnToggleSidebarFloating = document.getElementById('btn-toggle-sidebar-floating');

    const toggleSidebar = () => {
      if (!sidebar) return;
      const isCollapsed = sidebar.classList.toggle('collapsed');

      const labelHeader = isCollapsed ? '▶ Panel' : '◀ Panel';
      const labelFloating = isCollapsed ? '▶' : '◀';
      const titleText = isCollapsed ? 'Mostrar Panel Lateral' : 'Ocultar Panel Lateral';

      if (btnToggleSidebarHeader) {
        btnToggleSidebarHeader.textContent = labelHeader;
        btnToggleSidebarHeader.title = titleText;
        btnToggleSidebarHeader.setAttribute('aria-label', titleText);
      }

      if (btnToggleSidebarFloating) {
        btnToggleSidebarFloating.textContent = labelFloating;
        btnToggleSidebarFloating.title = titleText;
        btnToggleSidebarFloating.setAttribute('aria-label', titleText);
      }

      // Redimensionar el mapa luego de la transición CSS (250ms)
      setTimeout(() => {
        this.mapController?.resize();
      }, 260);
    };

    if (btnToggleSidebarHeader) {
      btnToggleSidebarHeader.addEventListener('click', toggleSidebar);
    }

    if (btnToggleSidebarFloating) {
      btnToggleSidebarFloating.addEventListener('click', toggleSidebar);
    }

    // 3. Control de colapso de la barra superior flotante de métricas (#map-floating-controls) - SPEC-30
    const floatingControls = document.getElementById('map-floating-controls');
    const btnToggleFloatingControls = document.getElementById('btn-toggle-floating-controls');

    const updateFloatingControlsButton = (isMinimized: boolean) => {
      if (!btnToggleFloatingControls) return;
      if (isMinimized) {
        const currentMode = this.store.getState().config.metricMode || 'COUNT';
        const label = this.getMetricLabel(currentMode);
        btnToggleFloatingControls.textContent = `${label} ▼`;
        btnToggleFloatingControls.title = 'Mostrar controles rápidos';
        btnToggleFloatingControls.setAttribute('aria-label', 'Mostrar controles rápidos');
      } else {
        btnToggleFloatingControls.textContent = '▲';
        btnToggleFloatingControls.title = 'Ocultar controles rápidos';
        btnToggleFloatingControls.setAttribute('aria-label', 'Ocultar controles rápidos');
      }
    };

    const toggleFloatingControls = () => {
      if (!floatingControls) return;
      const isMinimized = floatingControls.classList.toggle('minimized');
      updateFloatingControlsButton(isMinimized);
    };

    if (btnToggleFloatingControls) {
      btnToggleFloatingControls.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFloatingControls();
      });
    }

    if (floatingControls) {
      floatingControls.addEventListener('click', (e) => {
        if (floatingControls.classList.contains('minimized') && e.target !== btnToggleFloatingControls) {
          toggleFloatingControls();
        }
      });
    }
  }

  private getMetricLabel(mode: MetricMode): string {
    switch (mode) {
      case 'COUNT': return '📊 Siniestros';
      case 'VEHICLES': return '🚗 Vehículos';
      case 'PERSONS': return '👥 Personas';
      case 'EPDO': return '⚖️ EPDO';
      case 'DENSITY_KM': return '📈 Densidad (/km)';
      default: return '📊 Métricas';
    }
  }

  private setMetricMode(mode: MetricMode): void {
    // Sincronizar clases activas en sidebar y mapa
    document.querySelectorAll('.metric-tab-btn, .map-metric-pill, .btn-metric-selector').forEach((el) => {
      const elMode = el.getAttribute('data-mode') || el.getAttribute('data-metric');
      const isActive = elMode === mode;
      el.classList.toggle('active', isActive);
      el.classList.remove('btn-outline');
    });

    const badge = document.getElementById('badge-profile-metric');
    if (badge) {
      const labels: Record<MetricMode, string> = {
        COUNT: 'Siniestros',
        VEHICLES: 'Vehículos',
        PERSONS: 'Personas (Gravedad)',
        EPDO: 'EPDO',
        DENSITY_KM: 'Densidad (/km)'
      };
      badge.textContent = labels[mode] || mode;
    }

    // SPEC-30: Sincronizar etiqueta del botón minimizado si la barra flotante está oculta
    const floatingControls = document.getElementById('map-floating-controls');
    const btnToggleFloatingControls = document.getElementById('btn-toggle-floating-controls');
    if (floatingControls?.classList.contains('minimized') && btnToggleFloatingControls) {
      const label = this.getMetricLabel(mode);
      btnToggleFloatingControls.textContent = `${label} ▼`;
    }

    this.store.updateConfig({ metricMode: mode });
  }

  private setCurvilinearSide(side: 'RIGHT' | 'LEFT'): void {
    document.querySelectorAll('.btn-curv-side').forEach((el) => {
      const isActive = el.getAttribute('data-side') === side;
      el.classList.toggle('active', isActive);
      el.classList.remove('btn-outline');
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
    const elVehicles = document.getElementById('kpi-total-vehicles');
    const elPersons = document.getElementById('kpi-total-persons');
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

    // SPEC-14: Totales acumulados de vehículos y personas
    const totalVehicles = results.bins.reduce((sum, b) => sum + (b.totalVehicles || 0), 0);
    const totalPersons = results.bins.reduce((sum, b) => sum + (b.totalPersons || 0), 0);

    if (elVehicles) {
      elVehicles.textContent = String(totalVehicles);
    }
    if (elPersons) {
      elPersons.textContent = String(totalPersons);
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

    // SPEC-15: Descargar trazo activo en formato .txt
    const btnTxtTrace = document.getElementById('btn-export-txt-trace');
    if (btnTxtTrace) {
      btnTxtTrace.addEventListener('click', () => {
        const currentAlignment = this.store.getState().alignment;
        if (!currentAlignment) return;
        const txt = generateTxtAlignmentTrace(currentAlignment);
        triggerBrowserDownload(txt, `${currentAlignment.id}.txt`, 'text/plain;charset=utf-8');
      });
    }

    // SPEC-15: Descargar paquete GTFS completo (routes.txt + shapes.txt)
    const btnGtfsBundle = document.getElementById('btn-export-gtfs-bundle');
    if (btnGtfsBundle) {
      btnGtfsBundle.addEventListener('click', () => {
        const allRoutes = this.routeManager
          ? this.routeManager.getAllRoutes().map((r) => r.alignment)
          : [this.store.getState().alignment].filter(Boolean) as Alignment[];

        const routesTxt = generateGtfsRoutesTxt(allRoutes);
        const shapesTxt = generateGtfsShapesTxt(allRoutes);

        triggerBrowserDownload(routesTxt, 'routes.txt', 'text/plain;charset=utf-8');
        setTimeout(() => {
          triggerBrowserDownload(shapesTxt, 'shapes.txt', 'text/plain;charset=utf-8');
        }, 300);
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
            let newAlignment: Alignment;

            if (file.name.toLowerCase().endsWith('.txt')) {
              newAlignment = parseTxtAlignment(content, {
                id: file.name.replace(/\.[^/.]+$/, '').toUpperCase(),
                name: file.name.replace(/\.[^/.]+$/, '')
              });
            } else {
              newAlignment = parseGeoJsonAlignment(content, {
                alignmentName: file.name.replace(/\.[^/.]+$/, '')
              });
            }

            if (this.routeManager) {
              this.routeManager.addRoute(newAlignment, true);
            } else {
              this.store.setAlignment(newAlignment);
            }

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
