import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import {
  generateProjectedCrashesGeoJson,
  generateCorridorBinsGeoJson
} from '../../../src/pkg/export/geojson.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('GeoJSON Exporters (pkg/export) - SPEC-05 Compliance', () => {
  it('debe cumplir con Test Case 5.2: Validez RFC 7946 en GeoJSON de siniestros proyectados', () => {
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0030 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    const crashes: CrashPoint[] = [
      {
        id: 'CRASH-TEST-99',
        coordinates: [-77.0001, -12.0015],
        severity: SeverityLevel.LESIONES_GRAVES,
        type: CrashType.ATROPELLO,
        roadCode: 'PE-1N'
      }
    ];

    const results = analyzeLrs(alignment, crashes);
    const geojson = generateProjectedCrashesGeoJson(results);

    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features).toHaveLength(1);

    const f = geojson.features[0];
    expect(f.type).toBe('Feature');
    expect(f.geometry.type).toBe('Point');
    expect(f.geometry.coordinates).toEqual([-77.0001, -12.0015]);

    // Verificar propiedades enriquecidas LRS
    expect(f.properties.crash_id).toBe('CRASH-TEST-99');
    expect(f.properties.chainage_meters).toBeGreaterThan(0);
    expect(f.properties.station_formatted).toMatch(/^km 0\+\d\d\d\.\d\d$/);
    expect(f.properties.is_inside_buffer).toBe(true);
    expect(f.properties.road_side).toBe('LEFT');
  });

  it('debe generar GeoJSON de tramos del corredor con geometrías LineString válidas', () => {
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0030 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    const crashes: CrashPoint[] = [
      {
        id: 'CRASH-01',
        coordinates: [-77.0000, -12.0028],
        severity: SeverityLevel.FATAL,
        type: CrashType.CHOQUE
      }
    ];

    const results = analyzeLrs(alignment, crashes, { binSizeMeters: 100 });
    const corridorGeoJson = generateCorridorBinsGeoJson(alignment, results);

    expect(corridorGeoJson.type).toBe('FeatureCollection');
    expect(corridorGeoJson.features.length).toBeGreaterThanOrEqual(3);

    const firstBinFeature = corridorGeoJson.features[0];
    expect(firstBinFeature.geometry.type).toBe('LineString');
    expect(firstBinFeature.geometry.coordinates.length).toBeGreaterThanOrEqual(2);
    expect(firstBinFeature.properties.bin_index).toBe(0);
    expect(firstBinFeature.properties.total_crashes).toBe(1);
    expect(firstBinFeature.properties.fatal_count).toBe(1);
    expect(firstBinFeature.properties.epdo_score).toBe(9.5);
    expect(firstBinFeature.properties.risk_level).toBe('MEDIO');
  });
});
