import { describe, it, expect } from 'vitest';
import { parseTxtAlignment } from '../../../src/pkg/tracer/importers/txt.js';

describe('TXT Alignment Importer (pkg/tracer) - SPEC-15 Compliance', () => {
  const sampleTxtWithHeaders = `# RoadSafetyScan - Trazo de Alineamiento Vial: PE-1S
# Nombre: Corredor Panamericana Sur (Km 18 al 25)
index,longitude,latitude,cumulative_meters,station
0,-76.960000,-12.180000,0.00,km 0+000.00
1,-76.958000,-12.185000,596.96,km 0+596.96
2,-76.955000,-12.192000,1440.86,km 1+440.86`;

  const sampleSimpleLonLat = `-77.1750, -11.7800
-77.1690, -11.7650
-77.1620, -11.7510`;

  it('debe parsear archivo .txt con comentarios y encabezados MTC', () => {
    const alignment = parseTxtAlignment(sampleTxtWithHeaders);
    expect(alignment.id).toBe('PE-1S');
    expect(alignment.name).toBe('Corredor Panamericana Sur (Km 18 al 25)');
    expect(alignment.vertices).toHaveLength(3);
    expect(alignment.vertices[0].stationFormatted).toBe('km 0+000.00');
    expect(alignment.totalLength).toBeGreaterThan(1400);
  });

  it('debe parsear archivo .txt simple con pares lon, lat', () => {
    const alignment = parseTxtAlignment(sampleSimpleLonLat, {
      id: 'CUSTOM-01',
      name: 'Ruta Personalizada'
    });
    expect(alignment.id).toBe('CUSTOM-01');
    expect(alignment.name).toBe('Ruta Personalizada');
    expect(alignment.vertices).toHaveLength(3);
  });

  it('debe arrojar error si no hay suficientes coordenadas válidas', () => {
    expect(() => parseTxtAlignment('solo texto sin coordenadas')).toThrow(/al menos 2 coordenadas/);
  });
});
