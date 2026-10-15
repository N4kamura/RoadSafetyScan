/**
 * Pruebas unitarias para SPEC-37:
 * Reorganización del Panel Lateral (Prioridad de Parámetros LRS tras Rutas Activas)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('SPEC-37: Sidebar Reordering - LRS Parameters Priority', () => {
  let htmlContent: string;

  beforeEach(() => {
    const htmlPath = resolve(process.cwd(), 'index.html');
    htmlContent = readFileSync(htmlPath, 'utf-8');
  });

  it('debe cumplir con Test Case 37.1: Parámetros LRS ubicados inmediatamente después de Rutas Activas en el Mapa', () => {
    const idxRoutes = htmlContent.indexOf('id="routes-manager-list"');
    const idxBuffer = htmlContent.indexOf('id="slider-buffer-width"');
    const idxBinSize = htmlContent.indexOf('id="slider-bin-size"');

    expect(idxRoutes).toBeGreaterThan(0);
    expect(idxBuffer).toBeGreaterThan(0);
    expect(idxBinSize).toBeGreaterThan(0);

    // Rutas Activas debe preceder a los parámetros LRS
    expect(idxRoutes).toBeLessThan(idxBuffer);

    // Ancho de Buffer debe preceder a la Segmentación Métrica
    expect(idxBuffer).toBeLessThan(idxBinSize);
  });

  it('debe cumplir con Test Case 37.2: Parámetros LRS ubicados antes del Diagnóstico del Corredor y Perfil Curvilíneo', () => {
    const idxBuffer = htmlContent.indexOf('id="slider-buffer-width"');
    const idxKpi = htmlContent.indexOf('id="kpi-total-km"');
    const idxOffset = htmlContent.indexOf('id="slider-curv-offset"');

    expect(idxBuffer).toBeGreaterThan(0);
    expect(idxKpi).toBeGreaterThan(0);
    expect(idxOffset).toBeGreaterThan(0);

    // Los parámetros LRS deben preceder al Diagnóstico del Corredor (KPIs)
    expect(idxBuffer).toBeLessThan(idxKpi);

    // Los parámetros LRS deben preceder a los parámetros del Perfil Curvilíneo
    expect(idxBuffer).toBeLessThan(idxOffset);
  });

  it('debe cumplir con Test Case 37.3: Preservación de identificadores y selectores de presets métricos LRS', () => {
    expect(htmlContent).toContain('id="val-buffer-width"');
    expect(htmlContent).toContain('id="val-bin-size"');
    expect(htmlContent).toContain('data-bin="100"');
    expect(htmlContent).toContain('data-bin="200"');
    expect(htmlContent).toContain('data-bin="500"');
    expect(htmlContent).toContain('data-bin="1000"');
  });
});
