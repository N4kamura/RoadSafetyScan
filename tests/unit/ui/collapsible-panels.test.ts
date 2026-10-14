import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SidebarController } from '../../../src/ui/sidebar.js';
import { VizStore } from '../../../src/pkg/viz/store.js';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';

class MockClassList {
  private classes = new Set<string>();

  add(cls: string) {
    this.classes.add(cls);
  }

  remove(cls: string) {
    this.classes.delete(cls);
  }

  toggle(cls: string): boolean {
    if (this.classes.has(cls)) {
      this.classes.delete(cls);
      return false;
    } else {
      this.classes.add(cls);
      return true;
    }
  }

  contains(cls: string): boolean {
    return this.classes.has(cls);
  }
}

class MockElement {
  public classList = new MockClassList();
  public textContent: string = '';
  public title: string = '';
  public attributes: Record<string, string> = {};
  public listeners: Record<string, ((e: any) => void)[]> = {};

  setAttribute(k: string, v: string) {
    this.attributes[k] = v;
  }

  getAttribute(k: string): string | null {
    return this.attributes[k] ?? null;
  }

  addEventListener(event: string, cb: (e: any) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  dispatchEvent(event: string, e: any = {}) {
    e.target = e.target ?? this;
    e.stopPropagation = e.stopPropagation ?? (() => {});
    if (this.listeners[event]) {
      for (const cb of this.listeners[event]) {
        cb(e);
      }
    }
  }

  click() {
    const e = { target: this, stopPropagation: vi.fn() };
    this.dispatchEvent('click', e);
  }
}

describe('SPEC-29: Ocultamiento Colapsable de Leyenda Cartográfica y Panel Lateral', () => {
  let elements: Record<string, MockElement>;
  let mockMapController: { resize: ReturnType<typeof vi.fn> };
  let store: VizStore;

  beforeEach(() => {
    vi.useFakeTimers();

    elements = {
      'map-legend-overlay': new MockElement(),
      'legend-header': new MockElement(),
      'btn-legend-collapse': new MockElement(),
      'btn-toggle-sidebar': new MockElement(),
      'btn-toggle-sidebar-floating': new MockElement(),
      '.app-sidebar': new MockElement()
    };

    elements['btn-legend-collapse'].textContent = '▼';
    elements['btn-toggle-sidebar'].textContent = '◀ Panel';
    elements['btn-toggle-sidebar-floating'].textContent = '◀';

    mockMapController = {
      resize: vi.fn()
    };

    const mockDocument = {
      getElementById: (id: string) => elements[id] || null,
      querySelector: (selector: string) => elements[selector] || null,
      querySelectorAll: (_selector: string) => []
    };

    vi.stubGlobal('document', mockDocument);

    const alignment = createAlignment([
      { longitude: -77.0, latitude: -12.0 },
      { longitude: -77.0, latitude: -12.01 }
    ]);
    store = new VizStore(alignment, []);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('Test Case 29.1 & 29.2: Colapso y expansión de la leyenda cartográfica y actualización del ícono', () => {
    const sidebar = new SidebarController(store, undefined, undefined, mockMapController);

    const legendOverlay = elements['map-legend-overlay'];
    const btnLegendCollapse = elements['btn-legend-collapse'];
    const legendHeader = elements['legend-header'];

    expect(legendOverlay.classList.contains('minimized')).toBe(false);
    expect(btnLegendCollapse.textContent).toBe('▼');

    // 1. Clic en el botón de colapso
    btnLegendCollapse.click();

    expect(legendOverlay.classList.contains('minimized')).toBe(true);
    expect(btnLegendCollapse.textContent).toBe('▲');
    expect(btnLegendCollapse.title).toBe('Expandir Leyenda');
    expect(btnLegendCollapse.getAttribute('aria-label')).toBe('Expandir Leyenda');

    // 2. Clic en la cabecera para restaurar
    legendHeader.click();

    expect(legendOverlay.classList.contains('minimized')).toBe(false);
    expect(btnLegendCollapse.textContent).toBe('▼');
    expect(btnLegendCollapse.title).toBe('Minimizar Leyenda');
    expect(btnLegendCollapse.getAttribute('aria-label')).toBe('Minimizar Leyenda');
  });

  it('Test Case 29.3: Colapso y expansión del panel lateral (.app-sidebar)', () => {
    const sidebar = new SidebarController(store, undefined, undefined, mockMapController);

    const sidebarEl = elements['.app-sidebar'];
    const btnToggleHeader = elements['btn-toggle-sidebar'];

    expect(sidebarEl.classList.contains('collapsed')).toBe(false);

    // Clic en el botón de cabecera
    btnToggleHeader.click();

    expect(sidebarEl.classList.contains('collapsed')).toBe(true);

    // Clic nuevamente para restaurar
    btnToggleHeader.click();

    expect(sidebarEl.classList.contains('collapsed')).toBe(false);
  });

  it('Test Case 29.4: Sincronización dual de etiquetas y tooltips entre botón de cabecera y flotante', () => {
    const sidebar = new SidebarController(store, undefined, undefined, mockMapController);

    const btnHeader = elements['btn-toggle-sidebar'];
    const btnFloating = elements['btn-toggle-sidebar-floating'];
    const sidebarEl = elements['.app-sidebar'];

    // Estado inicial
    expect(btnHeader.textContent).toBe('◀ Panel');
    expect(btnFloating.textContent).toBe('◀');

    // Alternar mediante botón flotante sobre el mapa
    btnFloating.click();

    expect(sidebarEl.classList.contains('collapsed')).toBe(true);
    expect(btnHeader.textContent).toBe('▶ Panel');
    expect(btnFloating.textContent).toBe('▶');
    expect(btnHeader.title).toBe('Mostrar Panel Lateral');
    expect(btnFloating.title).toBe('Mostrar Panel Lateral');
    expect(btnHeader.getAttribute('aria-label')).toBe('Mostrar Panel Lateral');
    expect(btnFloating.getAttribute('aria-label')).toBe('Mostrar Panel Lateral');

    // Restaurar mediante botón de la cabecera
    btnHeader.click();

    expect(sidebarEl.classList.contains('collapsed')).toBe(false);
    expect(btnHeader.textContent).toBe('◀ Panel');
    expect(btnFloating.textContent).toBe('◀');
    expect(btnHeader.title).toBe('Ocultar Panel Lateral');
    expect(btnFloating.title).toBe('Ocultar Panel Lateral');
  });

  it('Test Case 29.5: Disparo de redimensionamiento del mapa (resize) tras transición CSS', () => {
    const sidebar = new SidebarController(store, undefined, undefined, mockMapController);

    const btnHeader = elements['btn-toggle-sidebar'];

    expect(mockMapController.resize).not.toHaveBeenCalled();

    btnHeader.click();

    // Antes de completarse la transición (ej. 100ms)
    vi.advanceTimersByTime(100);
    expect(mockMapController.resize).not.toHaveBeenCalled();

    // Al completarse el delay de 260ms
    vi.advanceTimersByTime(160);
    expect(mockMapController.resize).toHaveBeenCalledTimes(1);
  });
});
