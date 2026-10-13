import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { GeoCoordinate } from '../../../src/pkg/tracer/types.js';

describe('Alignment Builder & Validator (pkg/tracer) - SPEC-02 Compliance', () => {
  it('debe construir un alineamiento válido de 2 vértices', () => {
    const coords: GeoCoordinate[] = [
      { longitude: -77.0000, latitude: -12.0000 },
      { longitude: -77.0000, latitude: -12.0090 }
    ];

    const alignment = createAlignment(coords, 'TEST-01', 'Tramo Recto');

    expect(alignment.id).toBe('TEST-01');
    expect(alignment.name).toBe('Tramo Recto');
    expect(alignment.vertices).toHaveLength(2);
    expect(alignment.segments).toHaveLength(1);
    expect(alignment.totalLength).toBeGreaterThan(995);
    expect(alignment.totalLength).toBeLessThan(1005);
    expect(alignment.vertices[0].stationFormatted).toBe('km 0+000.00');
    expect(alignment.vertices[1].stationFormatted).toMatch(/^km 1\+00\d\.\d\d$/);
    expect(alignment.warnings).toBeUndefined();
  });

  it('debe cumplir con Test Case 2.2: Fusión de vértices degenerados (<0.10 m)', () => {
    const coords: GeoCoordinate[] = [
      { longitude: -77.0000, latitude: -12.0000 },
      // Vértice desplazado apenas ~2 centímetros (0.0000002 grados aprox)
      { longitude: -77.0000001, latitude: -12.0000001 },
      { longitude: -77.0000, latitude: -12.0090 }
    ];

    const alignment = createAlignment(coords);

    expect(alignment.vertices).toHaveLength(2);
    expect(alignment.segments).toHaveLength(1);
    expect(alignment.warnings).toBeDefined();
    expect(alignment.warnings?.[0].code).toBe('DEGENERATE_VERTEX_REMOVED');
  });

  it('debe arrojar error si todos los vértices colapsan a menos de 2 distintos', () => {
    const coords: GeoCoordinate[] = [
      { longitude: -77.0000, latitude: -12.0000 },
      { longitude: -77.0000, latitude: -12.0000 }
    ];

    expect(() => createAlignment(coords)).toThrow(/menos de 2 vértices válidos/);
  });

  it('debe calcular correctamente el Bounding Box global', () => {
    const coords: GeoCoordinate[] = [
      { longitude: -77.0500, latitude: -12.0100 },
      { longitude: -76.9500, latitude: -12.0800 },
      { longitude: -77.0200, latitude: -12.1500 }
    ];

    const alignment = createAlignment(coords);

    expect(alignment.bbox.minX).toBe(-77.0500);
    expect(alignment.bbox.maxX).toBe(-76.9500);
    expect(alignment.bbox.minY).toBe(-12.1500);
    expect(alignment.bbox.maxY).toBe(-12.0100);
  });

  it('debe detectar auto-intersección de segmentos no adyacentes', () => {
    // Trazado en figura de cruz o lazo (Segmento 0 y Segmento 2 se cruzan en "X")
    const coords: GeoCoordinate[] = [
      { longitude: -77.00, latitude: -12.00 }, // P0: Arriba-Derecha
      { longitude: -77.02, latitude: -12.02 }, // P1: Abajo-Izquierda
      { longitude: -77.02, latitude: -12.00 }, // P2: Arriba-Izquierda
      { longitude: -77.00, latitude: -12.02 }  // P3: Abajo-Derecha
    ];

    const alignment = createAlignment(coords);

    expect(alignment.warnings).toBeDefined();
    const selfInterWarn = alignment.warnings?.find(
      (w) => w.code === 'SELF_INTERSECTION_DETECTED'
    );
    expect(selfInterWarn).toBeDefined();
  });

  it('debe advertir sobre ángulos de deflexión agudos (> 150°)', () => {
    // Eje que va al Este y luego gira abruptamente casi 180° hacia el Oeste
    const coords: GeoCoordinate[] = [
      { longitude: -77.000, latitude: -12.000 },
      { longitude: -76.990, latitude: -12.000 }, // Hacia el Este (90°)
      { longitude: -76.999, latitude: -12.001 }  // Giro casi total hacia el Oeste (~260°)
    ];

    const alignment = createAlignment(coords);

    expect(alignment.warnings).toBeDefined();
    const sharpAngleWarn = alignment.warnings?.find(
      (w) => w.code === 'SHARP_DEFLECTION_ANGLE'
    );
    expect(sharpAngleWarn).toBeDefined();
  });
});
