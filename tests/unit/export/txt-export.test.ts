import { describe, it, expect } from 'vitest';
import { generateTxtAlignmentTrace } from '../../../src/pkg/export/txt.js';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';

describe('TXT Alignment Exporter (pkg/export) - SPEC-15 Compliance', () => {
  const alignment = createAlignment(
    [
      { longitude: -76.96, latitude: -12.18 },
      { longitude: -76.958, latitude: -12.185 }
    ],
    'PE-1S',
    'Panamericana Sur'
  );

  it('debe generar contenido .txt estructurado con encabezado y progresivas', () => {
    const txt = generateTxtAlignmentTrace(alignment);
    expect(txt).toContain('# RoadSafetyScan - Trazo de Alineamiento Vial: PE-1S');
    expect(txt).toContain('# Nombre: Panamericana Sur');
    expect(txt).toContain('index,longitude,latitude,cumulative_meters,station');
    expect(txt).toContain('0,-76.960000,-12.180000,0.00,km 0+000.00');
    expect(txt).toContain('1,-76.958000,-12.185000,596.96,km 0+596.96');
  });
});
