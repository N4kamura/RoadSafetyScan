import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseGeoJsonAlignment } from '../../../src/pkg/tracer/importers/geojson.js';

describe('GeoJSON Alignment Importer (pkg/tracer) - SPEC-02 Compliance', () => {
  it('debe importar una Feature<LineString> simple', () => {
    const geojson = {
      type: 'Feature',
      properties: { name: 'Eje Panamericana', id: 'PE-01' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-77.000, -12.000],
          [-77.000, -12.009]
        ]
      }
    };

    const alignment = parseGeoJsonAlignment(geojson);
    expect(alignment.id).toBe('PE-01');
    expect(alignment.name).toBe('Eje Panamericana');
    expect(alignment.vertices).toHaveLength(2);
    expect(alignment.segments).toHaveLength(1);
    expect(alignment.totalLength).toBeGreaterThan(995);
  });

  it('debe importar y validar el dataset real de prueba mock/alignment.geojson', () => {
    const mockPath = path.resolve(process.cwd(), 'mock/alignment.geojson');
    const content = fs.readFileSync(mockPath, 'utf-8');

    const alignment = parseGeoJsonAlignment(content);

    expect(alignment.id).toBe('AL-PE-PANASUR-01');
    expect(alignment.name).toContain('Panamericana Sur');
    expect(alignment.vertices).toHaveLength(10);
    expect(alignment.segments).toHaveLength(9);
    // Verificar longitud acumulada ~ 7,634.5 m
    expect(alignment.totalLength).toBeGreaterThan(7600);
    expect(alignment.totalLength).toBeLessThan(7700);

    // Verificar primera y última estación
    expect(alignment.vertices[0].stationFormatted).toBe('km 0+000.00');
    expect(alignment.vertices[alignment.vertices.length - 1].stationFormatted).toMatch(/^km 7\+63\d\.\d\d$/);
  });

  it('debe permitir sobreescribir id y name mediante opciones', () => {
    const geojson = {
      type: 'LineString',
      coordinates: [
        [-77.00, -12.00],
        [-77.01, -12.01]
      ]
    };

    const alignment = parseGeoJsonAlignment(geojson, {
      alignmentId: 'CUSTOM-ID',
      alignmentName: 'Corredor Personalizado'
    });

    expect(alignment.id).toBe('CUSTOM-ID');
    expect(alignment.name).toBe('Corredor Personalizado');
  });

  it('debe arrojar error si el archivo no contiene LineString', () => {
    const geojsonPoint = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-77.00, -12.00] }
        }
      ]
    };

    expect(() => parseGeoJsonAlignment(geojsonPoint)).toThrow(
      /No se encontró ninguna geometría LineString válida/
    );
  });

  it('debe arrojar error ante JSON malformado', () => {
    expect(() => parseGeoJsonAlignment('{ json invalido')).toThrow(
      /Error al parsear cadena GeoJSON/
    );
  });
});
