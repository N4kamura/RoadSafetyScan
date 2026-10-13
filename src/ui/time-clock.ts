/**
/**
 * Controlador del Reloj Dinámico Circular de Selección de Rango Horario
 * Conforme a SPEC-10 (ui/time-clock)
 */

import { VizStore } from '../pkg/viz/store.js';
import { TimeRange } from '../pkg/viz/types.js';

export function formatMinutes(minutes: number): string {
  const norm = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export class CircularTimeClockController {
  private container: HTMLElement;
  private store: VizStore;

  // Estado del reloj en minutos [0, 1440)
  // Por defecto: 00:00 a 24:00 (todos los siniestros)
  private startMinute: number = 0;
  private endMinute: number = 1440;
  private isFullDay: boolean = true;

  // Elementos DOM del SVG
  private svg!: SVGSVGElement;
  private blackArcPath!: SVGPathElement;
  private whiteArcPath!: SVGPathElement;
  private startHandle!: SVGCircleElement;
  private endHandle!: SVGCircleElement;
  private textStartEl!: HTMLElement;
  private textEndEl!: HTMLElement;

  // Constantes de dimensiones del dial
  private readonly size = 176;
  private readonly center = 88;
  private readonly radius = 68;
  private readonly strokeWidth = 14;

  // Control de arrastre
  private dragMode: 'START' | 'END' | 'ROTATE' | null = null;
  private lastAngleRad: number = 0;

  constructor(containerId: string, store: VizStore) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`Contenedor #${containerId} no encontrado en el DOM.`);
    }
    this.container = el;
    this.store = store;

    this.renderWidgetStructure();
    this.setupInteractions();
    this.updateClockVisuals();
  }

  private renderWidgetStructure(): void {
    this.container.innerHTML = `
      <div class="time-clock-card" title="Arrastre los extremos para cambiar el rango o gire la franja para mover el horario">
        <svg class="time-clock-svg" width="${this.size}" height="${this.size}" viewBox="0 0 ${this.size} ${this.size}">
          <!-- Fondo base circular -->
          <circle cx="${this.center}" cy="${this.center}" r="${this.radius}" fill="none" stroke="#E2E8F0" stroke-width="${this.strokeWidth}" />
          <!-- Franja blanca activa -->
          <path class="time-clock-arc-white" fill="none" stroke="#FFFFFF" stroke-width="${this.strokeWidth}" stroke-linecap="round" />
          <!-- Arco perimetral negro inactivo -->
          <path class="time-clock-arc-black" fill="none" stroke="#1E293B" stroke-width="${this.strokeWidth}" stroke-linecap="round" />
          <!-- Manija Extremo Inicio -->
          <circle class="time-clock-handle time-clock-handle-start" r="9" fill="#1E293B" stroke="#FFFFFF" stroke-width="2.5" />
          <!-- Manija Extremo Fin -->
          <circle class="time-clock-handle time-clock-handle-end" r="9" fill="#1E293B" stroke="#FFFFFF" stroke-width="2.5" />
        </svg>

        <!-- Visualizador Central de Horas -->
        <div class="time-clock-center-content">
          <div class="time-clock-time-val" id="time-clock-val-start">00:00</div>
          <div class="time-clock-label-to">to</div>
          <div class="time-clock-time-val" id="time-clock-val-end">24:00</div>
          <button class="time-clock-btn-reset" title="Restablecer a 24 Horas">Día Completo</button>
        </div>
      </div>
    `;

    this.svg = this.container.querySelector('.time-clock-svg') as SVGSVGElement;
    this.blackArcPath = this.container.querySelector('.time-clock-arc-black') as SVGPathElement;
    this.whiteArcPath = this.container.querySelector('.time-clock-arc-white') as SVGPathElement;
    this.startHandle = this.container.querySelector('.time-clock-handle-start') as SVGCircleElement;
    this.endHandle = this.container.querySelector('.time-clock-handle-end') as SVGCircleElement;
    this.textStartEl = this.container.querySelector('#time-clock-val-start') as HTMLElement;
    this.textEndEl = this.container.querySelector('#time-clock-val-end') as HTMLElement;

    const btnReset = this.container.querySelector('.time-clock-btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetToFullDay();
      });
    }
  }

  /**
   * Convierte minutos [0, 1440) a ángulo en radianes.
   * 00:00 está arriba (-PI/2). Sentido horario.
   */
  private minutesToAngle(minutes: number): number {
    const fraction = (minutes % 1440) / 1440;
    return fraction * 2 * Math.PI - Math.PI / 2;
  }

  /**
   * Convierte coordenadas de puntero (x, y) a minutos [0, 1440).
   */
  private pointerToMinutes(clientX: number, clientY: number): number {
    const rect = this.svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    let angle = Math.atan2(dy, dx) + Math.PI / 2; // Arriba = 0
    if (angle < 0) angle += 2 * Math.PI;

    const fraction = angle / (2 * Math.PI);
    return Math.round(fraction * 1440) % 1440;
  }

  /**
   * Genera el path SVG para un arco circular desde ángulo startRad hasta endRad en sentido horario.
   */
  private describeArc(startAngle: number, endAngle: number): string {
    let diff = endAngle - startAngle;
    while (diff < 0) diff += 2 * Math.PI;
    while (diff >= 2 * Math.PI) diff -= 2 * Math.PI;

    const x1 = this.center + this.radius * Math.cos(startAngle);
    const y1 = this.center + this.radius * Math.sin(startAngle);
    const x2 = this.center + this.radius * Math.cos(endAngle);
    const y2 = this.center + this.radius * Math.sin(endAngle);

    const largeArcFlag = diff > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${this.radius} ${this.radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  }

  private updateClockVisuals(): void {
    if (this.isFullDay) {
      this.textStartEl.textContent = '00:00';
      this.textEndEl.textContent = '24:00';
      this.blackArcPath.setAttribute('d', '');
      this.whiteArcPath.setAttribute('d', '');
      this.startHandle.style.display = 'none';
      this.endHandle.style.display = 'none';
      return;
    }

    this.startHandle.style.display = 'block';
    this.endHandle.style.display = 'block';

    const startAng = this.minutesToAngle(this.startMinute);
    const endAng = this.minutesToAngle(this.endMinute);

    // 1. Franja blanca activa: de startAng a endAng
    this.whiteArcPath.setAttribute('d', this.describeArc(startAng, endAng));

    // 2. Arco negro inactivo: de endAng a startAng (el resto del círculo)
    this.blackArcPath.setAttribute('d', this.describeArc(endAng, startAng));

    // 3. Posicionar manijas
    const sx = this.center + this.radius * Math.cos(startAng);
    const sy = this.center + this.radius * Math.sin(startAng);
    this.startHandle.setAttribute('cx', String(sx));
    this.startHandle.setAttribute('cy', String(sy));

    const ex = this.center + this.radius * Math.cos(endAng);
    const ey = this.center + this.radius * Math.sin(endAng);
    this.endHandle.setAttribute('cx', String(ex));
    this.endHandle.setAttribute('cy', String(ey));

    // 4. Actualizar texto central
    this.textStartEl.textContent = formatMinutes(this.startMinute);
    this.textEndEl.textContent = formatMinutes(this.endMinute);
  }

  private setupInteractions(): void {
    const onPointerDown = (e: PointerEvent, mode: 'START' | 'END' | 'ROTATE') => {
      e.preventDefault();
      e.stopPropagation();
      this.dragMode = mode;
      this.isFullDay = false;

      const rect = this.svg.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      this.lastAngleRad = Math.atan2(dy, dx);

      this.svg.setPointerCapture(e.pointerId);
    };

    this.startHandle.addEventListener('pointerdown', (e) => onPointerDown(e, 'START'));
    this.endHandle.addEventListener('pointerdown', (e) => onPointerDown(e, 'END'));

    // Arrastrar sobre el SVG rota el intervalo o ajusta el horario
    this.svg.addEventListener('pointerdown', (e) => {
      if (e.target === this.startHandle || e.target === this.endHandle) return;
      onPointerDown(e, 'ROTATE');
    });

    this.svg.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.dragMode) return;
      e.preventDefault();

      const rect = this.svg.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const currentAngleRad = Math.atan2(dy, dx);
      const currentMinutes = this.pointerToMinutes(e.clientX, e.clientY);

      if (this.dragMode === 'START') {
        this.startMinute = currentMinutes;
      } else if (this.dragMode === 'END') {
        this.endMinute = currentMinutes;
      } else if (this.dragMode === 'ROTATE') {
        let deltaRad = currentAngleRad - this.lastAngleRad;
        // Normalizar salto -PI / +PI
        if (deltaRad > Math.PI) deltaRad -= 2 * Math.PI;
        if (deltaRad < -Math.PI) deltaRad += 2 * Math.PI;

        const deltaMinutes = (deltaRad / (2 * Math.PI)) * 1440;
        this.startMinute = ((Math.round(this.startMinute + deltaMinutes) % 1440) + 1440) % 1440;
        this.endMinute = ((Math.round(this.endMinute + deltaMinutes) % 1440) + 1440) % 1440;
        this.lastAngleRad = currentAngleRad;
      }

      this.updateClockVisuals();
      this.emitFilterUpdate();
    });

    const onPointerUp = (e: PointerEvent) => {
      if (this.dragMode) {
        this.dragMode = null;
        try {
          this.svg.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    this.svg.addEventListener('pointerup', onPointerUp);
    this.svg.addEventListener('pointercancel', onPointerUp);
  }

  private emitFilterUpdate(): void {
    if (this.isFullDay) {
      this.store.setTimeRange(null);
    } else {
      this.store.setTimeRange({
        startMinute: this.startMinute,
        endMinute: this.endMinute
      });
    }
  }

  public setRange(startMinute: number, endMinute: number): void {
    this.isFullDay = false;
    this.startMinute = ((startMinute % 1440) + 1440) % 1440;
    this.endMinute = ((endMinute % 1440) + 1440) % 1440;
    this.updateClockVisuals();
    this.emitFilterUpdate();
  }

  public resetToFullDay(): void {
    this.isFullDay = true;
    this.startMinute = 0;
    this.endMinute = 1440;
    this.updateClockVisuals();
    this.emitFilterUpdate();
  }
}
