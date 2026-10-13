/**
 * Componente del Perfilador Longitudinal con VisQuill GDK
 * Conforme a SPEC-04 (pkg/viz) y Directivas de Licenciamiento de la Constitución
 */

import { VizStore } from '../pkg/viz/store.js';
import { buildVisQuillConfig, VisQuillDataPoint } from '../pkg/viz/visquill-adapter.js';
import { SEVERITY_COLORS, VISQUILL_ATTRIBUTION, MetricMode } from '../pkg/viz/types.js';
import { formatStation } from '../pkg/tracer/geodesy.js';

export class LongitudinalProfileView {
  private container: HTMLElement;
  private store: VizStore;
  private tooltipEl: HTMLElement;

  constructor(containerId: string, store: VizStore) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`Contenedor del perfilador no encontrado: #${containerId}`);
    }
    this.container = el;
    this.store = store;

    // Crear tooltip flotante
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'chart-tooltip';
    document.body.appendChild(this.tooltipEl);

    this.render();

    // Re-renderizar reactivamente
    this.store.subscribe((state, event) => {
      if (
        event.type === 'LRS_RECALCULATED' ||
        event.type === 'CONFIG_UPDATED' ||
        event.type === 'FILTERS_UPDATED' ||
        event.type === 'BIN_HOVER' ||
        event.type === 'BIN_SELECT' ||
        event.type === 'CRASH_HOVER' ||
        event.type === 'SELECTION_CLEARED'
      ) {
        this.render();
      }
    });

    // Manejar resize de ventana
    window.addEventListener('resize', () => {
      this.render();
    });
  }

  public render(): void {
    const state = this.store.getState();
    if (!state.lrsResults || !state.alignment) {
      this.container.innerHTML = `
        <div style="height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.85rem;">
          Cargue un eje vial y siniestros para generar el perfil longitudinal.
        </div>
      `;
      return;
    }

    const metricMode = state.config.metricMode;
    const vqConfig = buildVisQuillConfig(state.lrsResults, this.container.id, metricMode);

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 260;

    const margin = { top: 20, right: 30, bottom: 45, left: 55 };
    const innerWidth = Math.max(100, width - margin.left - margin.right);
    const innerHeight = Math.max(60, height - margin.top - margin.bottom);

    const totalLength = vqConfig.xAxis.maxChainage || 1;
    const maxVal = Math.max(
      1,
      ...vqConfig.data.map((d) => d.totalValue)
    );

    // Bins layout
    const bins = vqConfig.data;
    const numBins = bins.length;
    const barWidth = Math.max(2, innerWidth / numBins);

    // Construir SVG
    let svgHtml = `
      <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="user-select: none; overflow: visible;">
        <!-- Fondo y Ejes -->
        <g transform="translate(${margin.left}, ${margin.top})">
          <!-- Líneas de cuadrícula horizontal Y -->
    `;

    // 4 líneas de referencia en Y
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((maxVal / 4) * i);
      const yPos = innerHeight - (innerHeight / 4) * i;
      svgHtml += `
        <line x1="0" y1="${yPos}" x2="${innerWidth}" y2="${yPos}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="-8" y="${yPos + 4}" font-size="10" font-family="monospace" fill="#64748b" text-anchor="end">${val}</text>
      `;
    }

    // Líneas verticales de referencia en X (cada 1 km)
    for (let m = 0; m <= totalLength; m += 1000) {
      const xPos = (m / totalLength) * innerWidth;
      const kmLabel = `km ${Math.floor(m / 1000)}`;
      svgHtml += `
        <line x1="${xPos}" y1="0" x2="${xPos}" y2="${innerHeight}" stroke="#f1f5f9" stroke-width="1"/>
        <line x1="${xPos}" y1="${innerHeight}" x2="${xPos}" y2="${innerHeight + 5}" stroke="#94a3b8" stroke-width="1"/>
        <text x="${xPos}" y="${innerHeight + 18}" font-size="10" font-family="monospace" fill="#64748b" text-anchor="middle">${kmLabel}</text>
      `;
    }

    // Renderizar Barras Apiladas por Bin
    const hoveredIdx = state.selection.hoveredBinIndex;
    const selectedIdx = state.selection.selectedBinIndex;

    bins.forEach((d, idx) => {
      const x = (d.chainageMeters / totalLength) * innerWidth;
      const totalBarHeight = (d.totalValue / maxVal) * innerHeight;
      const y = innerHeight - totalBarHeight;

      const isHovered = hoveredIdx === idx;
      const isSelected = selectedIdx === idx;
      const isHighlighted = isHovered || isSelected;

      // Desglose proporcional de severidad si metricMode es COUNT
      let fatalH = 0;
      let graveH = 0;
      let leveH = 0;
      let danosH = 0;

      if (metricMode === 'COUNT' && d.totalValue > 0) {
        fatalH = (d.fatalCount / d.totalValue) * totalBarHeight;
        graveH = (d.graveCount / d.totalValue) * totalBarHeight;
        leveH = (d.leveCount / d.totalValue) * totalBarHeight;
        danosH = (d.danosCount / d.totalValue) * totalBarHeight;
      } else {
        // En modo EPDO o DENSITY, usar color según nivel de severidad predominante
        fatalH = totalBarHeight;
      }

      const barFill = d.fatalCount > 0 
        ? SEVERITY_COLORS['FATAL']
        : d.graveCount > 0 
        ? SEVERITY_COLORS['LESIONES_GRAVES'] 
        : d.leveCount > 0 
        ? SEVERITY_COLORS['LESIONES_LEVES'] 
        : SEVERITY_COLORS['SOLO_DANOS'];

      svgHtml += `
        <g class="profile-bar-group" data-bin-index="${idx}" style="cursor: pointer;">
          <!-- Barra de fondo de interacción transparente para facilitar hover -->
          <rect x="${x}" y="0" width="${barWidth}" height="${innerHeight}" fill="transparent" />

          <!-- Barra de datos -->
          <rect 
            x="${x + 0.5}" 
            y="${y}" 
            width="${Math.max(1, barWidth - 1)}" 
            height="${Math.max(1, totalBarHeight)}" 
            fill="${barFill}"
            opacity="${isHighlighted ? 1.0 : (hoveredIdx !== null ? 0.4 : 0.85)}"
            rx="1"
          />

          <!-- Marco de resalte al hacer hover / selección -->
          ${
            isHighlighted
              ? `<rect 
                  x="${x - 1}" 
                  y="${Math.max(0, y - 2)}" 
                  width="${barWidth + 2}" 
                  height="${totalBarHeight + 2}" 
                  fill="none" 
                  stroke="#10b981" 
                  stroke-width="2.5" 
                  rx="2"
                  filter="drop-shadow(0 0 3px rgba(16, 185, 129, 0.6))"
                />`
              : ''
          }
        </g>
      `;
    });

    svgHtml += `
          <!-- Eje horizontal basal -->
          <line x1="0" y1="${innerHeight}" x2="${innerWidth}" y2="${innerHeight}" stroke="#94a3b8" stroke-width="1.5"/>
        </g>
      </svg>
    `;

    this.container.innerHTML = svgHtml;

    this.attachEventListeners(bins);
  }

  private attachEventListeners(bins: VisQuillDataPoint[]): void {
    const barGroups = this.container.querySelectorAll('.profile-bar-group');

    barGroups.forEach((group) => {
      const idx = Number(group.getAttribute('data-bin-index'));
      const binData = bins[idx];
      if (!binData) return;

      group.addEventListener('mouseenter', (e) => {
        const mouseEv = e as MouseEvent;
        this.store.hoverBin(idx);

        // Desplegar tooltip
        const startStation = binData.stationLabel;
        const endStation = formatStation(binData.chainageMeters + this.store.getState().config.binSizeMeters);

        this.tooltipEl.innerHTML = `
          <div class="chart-tooltip-station">${startStation} - ${endStation}</div>
          <div class="chart-tooltip-row">
            <span>Total Siniestros:</span>
            <strong>${binData.totalValue}</strong>
          </div>
          <div class="chart-tooltip-row" style="color: #fca5a5;">
            <span>Fatales:</span>
            <strong>${binData.fatalCount}</strong>
          </div>
          <div class="chart-tooltip-row" style="color: #fdba74;">
            <span>Graves:</span>
            <strong>${binData.graveCount}</strong>
          </div>
          <div class="chart-tooltip-row" style="color: #fde047;">
            <span>Leves:</span>
            <strong>${binData.leveCount}</strong>
          </div>
          <div class="chart-tooltip-row" style="color: #93c5fd;">
            <span>Solo Daños:</span>
            <strong>${binData.danosCount}</strong>
          </div>
          <div class="chart-tooltip-row" style="border-top: 1px solid #334155; margin-top: 4px; padding-top: 4px;">
            <span>Índice EPDO (MTC):</span>
            <strong style="color: #38bdf8;">${binData.epdoScore.toFixed(1)}</strong>
          </div>
          <div class="chart-tooltip-row">
            <span>Densidad:</span>
            <strong>${binData.densityPerKm.toFixed(1)} / km</strong>
          </div>
        `;

        this.tooltipEl.style.display = 'block';
        this.positionTooltip(mouseEv.pageX, mouseEv.pageY);
      });

      group.addEventListener('mousemove', (e) => {
        const mouseEv = e as MouseEvent;
        this.positionTooltip(mouseEv.pageX, mouseEv.pageY);
      });

      group.addEventListener('mouseleave', () => {
        this.tooltipEl.style.display = 'none';
        this.store.hoverBin(null);
      });

      group.addEventListener('click', () => {
        this.store.selectBin(idx);
      });
    });
  }

  private positionTooltip(x: number, y: number): void {
    const tooltipWidth = this.tooltipEl.offsetWidth || 180;
    const tooltipHeight = this.tooltipEl.offsetHeight || 140;

    let posX = x + 15;
    let posY = y - tooltipHeight - 15;

    if (posX + tooltipWidth > window.innerWidth) {
      posX = x - tooltipWidth - 15;
    }
    if (posY < 10) {
      posY = y + 20;
    }

    this.tooltipEl.style.left = `${posX}px`;
    this.tooltipEl.style.top = `${posY}px`;
  }
}
