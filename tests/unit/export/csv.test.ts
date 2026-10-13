import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import { generateCsvProfileReport, CSV_BOM, CSV_HEADERS } from '../../../src/pkg/export/csv.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('CSV Profile Exporter (pkg/export) - SPEC-05 Compliance', () => {
  it('debe cumplir con Test Case 5.1: Integridad de Codificación CSV, UTF-8 BOM y Cabeceras', () => {
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0030 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    const crashes: CrashPoint[] = [
      {
        id: 'CRASH-01',
        coordinates: [-77.0000, -12.0020],
        severity: SeverityLevel.FATAL,
        type: CrashType.CHOQUE
      }
    ];

    const results = analyzeLrs(alignment, crashes, { binSizeMeters: 100 });
    const csvContent = generateCsvProfileReport(results);

    // 1. Debe iniciar con el BOM de UTF-8 (\uFEFF)
    expect(csvContent.startsWith(CSV_BOM)).toBe(true);

    // 2. Extraer líneas omitiendo el BOM
    const lines = csvContent.replace(CSV_BOM, '').trim().split('\n');

    // 3. La primera línea debe tener exactamente las cabeceras estándar
    expect(lines[0]).toBe(CSV_HEADERS);
    expect(lines[0].split(',')).toHaveLength(13);

    // 4. Debe tener al menos 3 filas de bins para ~330 m
    expect(lines.length).toBeGreaterThanOrEqual(4);

    // 5. Las columnas deben ser valores numéricos y cadenas bien entrecomilladas
    const secondRow = lines[1].split(',');
    expect(secondRow).toHaveLength(13);
    expect(secondRow[0]).toBe('0'); // bin_index
  });
});
