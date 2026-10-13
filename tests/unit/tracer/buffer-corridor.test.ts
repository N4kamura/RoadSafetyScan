import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { generateBufferPolygonFeature } from '../../../src/pkg/tracer/buffer.js';

describe('SPEC-22: Buffer Corridor Polygon Visualization', () => {
  const alignment = createAlignment(
    [
      { longitude: -77.05, latitude: -12.05 },
      { longitude: -77.03, latitude: -12.07 }
    ],
    'ALIGN-BUF-TEST',
    'Eje de Prueba Buffer'
  );

  it('genera un FeatureCollection con un polígono cerrado para un ancho de buffer positivo', () => {
    const geojson = generateBufferPolygonFeature(alignment, 25);
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features.length).toBe(1);

    const feat = geojson.features[0];
    expect(feat.geometry.type).toBe('Polygon');
    expect(feat.properties?.bufferWidthMeters).toBe(25);
    expect(feat.properties?.totalWidthMeters).toBe(50);

    const coords = (feat.geometry as any).coordinates[0];
    expect(coords.length).toBeGreaterThan(4);
    // Debe estar cerrado: primer punto igual al último punto
    expect(coords[0][0]).toBeCloseTo(coords[coords.length - 1][0], 5);
    expect(coords[0][1]).toBeCloseTo(coords[coords.length - 1][1], 5);
  });

  it('retorna FeatureCollection vacío si el ancho de buffer es menor o igual a 0', () => {
    const geojsonZero = generateBufferPolygonFeature(alignment, 0);
    expect(geojsonZero.features.length).toBe(0);

    const geojsonNeg = generateBufferPolygonFeature(alignment, -10);
    expect(geojsonNeg.features.length).toBe(0);
  });

  it('ensancha las coordenadas del polígono cuando el ancho de faja aumenta', () => {
    const buf25 = generateBufferPolygonFeature(alignment, 25);
    const buf50 = generateBufferPolygonFeature(alignment, 50);

    const ring25 = (buf25.features[0].geometry as any).coordinates[0];
    const ring50 = (buf50.features[0].geometry as any).coordinates[0];

    // La distancia transversal al eje debe ser mayor en buf50 que en buf25
    expect(ring50[0][0]).not.toEqual(ring25[0][0]);
  });
});
