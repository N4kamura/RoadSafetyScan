/**
 * Pruebas unitarias para SPEC-38:
 * Escalabilidad Responsiva y Ajuste Dinámico de la Barra Flotante de Métricas
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('SPEC-38: Responsive Floating Controls Auto-Scaling', () => {
  let cssContent: string;
  let htmlContent: string;

  beforeEach(() => {
    const cssPath = resolve(process.cwd(), 'src/ui/styles.css');
    const htmlPath = resolve(process.cwd(), 'index.html');
    cssContent = readFileSync(cssPath, 'utf-8');
    htmlContent = readFileSync(htmlPath, 'utf-8');
  });

  it('debe cumplir con Test Case 38.1: Confinamiento max-width y scrollbar invisible en .map-floating-controls', () => {
    expect(cssContent).toContain('.map-floating-controls');
    expect(cssContent).toContain('max-width: calc(100% - 5rem)');
    expect(cssContent).toContain('overflow-x: auto');
    expect(cssContent).toContain('scrollbar-width: none');
  });

  it('debe cumplir con Test Case 38.2: Puntos de quiebre (media queries) para compactación progresiva en pantallas reducidas', () => {
    // Breakpoint pantallas medianas (<= 1360px)
    expect(cssContent).toContain('@media (max-width: 1360px)');

    // Breakpoint pantallas compactas (<= 1080px)
    expect(cssContent).toContain('@media (max-width: 1080px)');

    // Breakpoint pantallas móviles/estrechas (<= 768px) con envolvente multilínea
    expect(cssContent).toContain('@media (max-width: 768px)');
    expect(cssContent).toContain('flex-wrap: wrap');
  });

  it('debe cumplir con Test Case 38.3: Preservación del botón toggle y cuerpo de pastillas flotantes', () => {
    expect(htmlContent).toContain('id="btn-toggle-floating-controls"');
    expect(htmlContent).toContain('id="map-floating-controls-body"');
    expect(htmlContent).toContain('class="map-floating-controls"');
  });
});
