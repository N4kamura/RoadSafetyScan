import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  geodesicAzimuth,
  formatStation,
  parseStation,
  EARTH_RADIUS_METERS
} from '../../../src/pkg/tracer/geodesy.js';
import { GeoCoordinate } from '../../../src/pkg/tracer/types.js';

describe('Geodesy Utilities (pkg/tracer) - SPEC-02 Compliance', () => {
  describe('haversineDistance', () => {
    it('debe retornar 0 para coordenadas idénticas', () => {
      const p: GeoCoordinate = { longitude: -77.0428, latitude: -12.0464 };
      expect(haversineDistance(p, p)).toBe(0);
    });

    it('debe cumplir el Test Case 2.1 de SPEC-02 (Segmento Recto Norte-Sur de 1 km aprox)', () => {
      const v0: GeoCoordinate = { longitude: -77.0000, latitude: -12.0000 };
      const v1: GeoCoordinate = { longitude: -77.0000, latitude: -12.0090 };

      const dist = haversineDistance(v0, v1);
      // 0.009 grados latitud ~ 1000 m
      expect(dist).toBeGreaterThanOrEqual(995.0);
      expect(dist).toBeLessThanOrEqual(1005.0);
    });

    it('debe calcular la distancia entre dos puntos conocidos en Lima con precisión métrica', () => {
      // Plaza Mayor de Lima a Parque Kennedy (Miraflores) ~ 9.0 km en línea recta
      const plazaMayor: GeoCoordinate = { longitude: -77.0305, latitude: -12.0453 };
      const parqueKennedy: GeoCoordinate = { longitude: -77.0298, latitude: -12.1217 };

      const dist = haversineDistance(plazaMayor, parqueKennedy);
      expect(dist).toBeGreaterThan(8400);
      expect(dist).toBeLessThan(8600);
    });
  });

  describe('geodesicAzimuth', () => {
    it('debe calcular azimuts cardinales exactos', () => {
      const center: GeoCoordinate = { longitude: 0, latitude: 0 };
      const north: GeoCoordinate = { longitude: 0, latitude: 1 };
      const south: GeoCoordinate = { longitude: 0, latitude: -1 };
      const east: GeoCoordinate = { longitude: 1, latitude: 0 };
      const west: GeoCoordinate = { longitude: -1, latitude: 0 };

      expect(geodesicAzimuth(center, north)).toBeCloseTo(0, 1);
      expect(geodesicAzimuth(center, east)).toBeCloseTo(90, 1);
      expect(geodesicAzimuth(center, south)).toBeCloseTo(180, 1);
      expect(geodesicAzimuth(center, west)).toBeCloseTo(270, 1);
    });

    it('debe calcular azimut hacia el Sur para Test Case 2.1', () => {
      const v0: GeoCoordinate = { longitude: -77.0000, latitude: -12.0000 };
      const v1: GeoCoordinate = { longitude: -77.0000, latitude: -12.0090 };

      const azimuth = geodesicAzimuth(v0, v1);
      expect(azimuth).toBeCloseTo(180.0, 1);
    });
  });

  describe('formatStation (MTC DG-2018)', () => {
    it('debe formatear progresivas estándar en notación km K+PPP.PP', () => {
      expect(formatStation(0)).toBe('km 0+000.00');
      expect(formatStation(345.8)).toBe('km 0+345.80');
      expect(formatStation(1000)).toBe('km 1+000.00');
      expect(formatStation(14520.12)).toBe('km 14+520.12');
    });

    it('debe manejar bordes y redondeos de coma flotante', () => {
      expect(formatStation(999.999)).toBe('km 1+000.00');
      expect(formatStation(5.2)).toBe('km 0+005.20');
      expect(formatStation(10005.05)).toBe('km 10+005.05');
    });
  });

  describe('parseStation', () => {
    it('debe revertir cadenas válidas a metros', () => {
      expect(parseStation('km 0+000.00')).toBe(0);
      expect(parseStation('km 0+345.80')).toBeCloseTo(345.8, 2);
      expect(parseStation('km 14+520.12')).toBeCloseTo(14520.12, 2);
    });

    it('debe arrojar error en formatos no válidos', () => {
      expect(() => parseStation('invalido')).toThrow();
      expect(() => parseStation('km 12')).toThrow();
    });
  });
});
