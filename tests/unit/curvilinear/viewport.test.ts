import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import {
  computeZoomAdaptiveBinSize,
  computeVisibleStationRange
} from '../../../src/pkg/curvilinear/viewport.js';

describe('SPEC-23: Viewport Clipping and Zoom-Adaptive Binning', () => {
  describe('computeZoomAdaptiveBinSize', () => {
    it('garantiza que la segmentación mínima sea estrictamente 100 m en zoom cercano', () => {
      expect(computeZoomAdaptiveBinSize(18.0)).toBe(100);
      expect(computeZoomAdaptiveBinSize(16.0)).toBe(100);
      expect(computeZoomAdaptiveBinSize(15.0)).toBe(100);
      expect(computeZoomAdaptiveBinSize(14.5)).toBe(100);
    });

    it('aumenta progresivamente el tamaño de bin al alejarse con el zoom', () => {
      expect(computeZoomAdaptiveBinSize(14.0)).toBe(200);
      expect(computeZoomAdaptiveBinSize(13.0)).toBe(500);
      expect(computeZoomAdaptiveBinSize(11.5)).toBe(1000);
      expect(computeZoomAdaptiveBinSize(10.0)).toBe(2000);
      expect(computeZoomAdaptiveBinSize(5.0)).toBe(2000);
    });

    it('nunca devuelve un valor inferior a 100 m', () => {
      for (let z = 0; z <= 22; z += 0.5) {
        expect(computeZoomAdaptiveBinSize(z)).toBeGreaterThanOrEqual(100);
      }
    });
  });

  describe('computeVisibleStationRange', () => {
    // Eje recto que va de (-77.00, -12.00) a (-77.00, -12.10) (aprox. 11.1 km de Norte a Sur)
    const alignment = createAlignment([
      { longitude: -77.00, latitude: -12.00 },
      { longitude: -77.00, latitude: -12.10 }
    ]);

    it('retorna el rango completo cuando toda la carretera está dentro del viewport', () => {
      const bounds = {
        west: -77.05,
        east: -76.95,
        south: -12.15,
        north: -11.95
      };

      const range = computeVisibleStationRange(alignment, bounds, 0);
      expect(range).not.toBeNull();
      expect(range![0]).toBe(0);
      expect(range![1]).toBeCloseTo(alignment.totalLength, 0);
    });

    it('recorta las progresivas cuando el viewport solo cubre una sección intermedia de la carretera', () => {
      // Viewport que solo encuadra la mitad central: latitud -12.04 a -12.06
      const bounds = {
        west: -77.05,
        east: -76.95,
        south: -12.06,
        north: -12.04
      };

      const range = computeVisibleStationRange(alignment, bounds, 50);
      expect(range).not.toBeNull();
      // Debe estar estrictamente dentro del rango de la carretera y menor que la longitud total
      expect(range![0]).toBeGreaterThan(0);
      expect(range![1]).toBeLessThan(alignment.totalLength);
      expect(range![1]).toBeGreaterThan(range![0]);
    });

    it('retorna null si la carretera está completamente fuera del viewport', () => {
      const boundsFarAway = {
        west: -75.05,
        east: -74.95,
        south: -10.15,
        north: -9.95
      };

      const range = computeVisibleStationRange(alignment, boundsFarAway);
      expect(range).toBeNull();
    });
  });
});
