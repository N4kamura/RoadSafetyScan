import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import { generateCurvilinearProfile } from '../../../src/pkg/curvilinear/generator.js';
import { haversineDistance } from '../../../src/pkg/tracer/geodesy.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('Curvilinear Profile along a Line (pkg/curvilinear) - SPEC-06 Compliance', () => {
  it('debe cumplir con Test Case 6.1: Generación de Línea Base Paralela Desplazada (Offset Baseline)', () => {
    // Eje recto Sur a Norte de 1,000 m
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0090 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    const results = analyzeLrs(alignment, []);
    const offsetMeters = 500;

    const profile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: offsetMeters,
      side: 'RIGHT'
    });

    // La baseline debe tener coordenadas desplazadas hacia el Este (mayor longitud)
    expect(profile.baselineCoordinates.length).toBeGreaterThan(1);
    
    // Verificar que el primer punto de la baseline dista ~500 m del inicio de la carretera
    const roadStart = alignment.vertices[0].coordinates;
    const baseStart = {
      longitude: profile.baselineCoordinates[0][0],
      latitude: profile.baselineCoordinates[0][1]
    };

    const dist = haversineDistance(roadStart, baseStart);
    expect(dist).toBeGreaterThanOrEqual(490);
    expect(dist).toBeLessThanOrEqual(510);
    expect(baseStart.longitude).toBeGreaterThan(roadStart.longitude); // Hacia la derecha (Este)
  });

  it('debe cumplir con Test Case 6.2: Extrusión Ortogonal de Barras del Histograma', () => {
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0090 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    const crashes: CrashPoint[] = [
      {
        id: 'C-01',
        coordinates: [-77.0000, -12.0085], // Dentro del primer bin [0m, 100m) (~55.5m del inicio)
        severity: SeverityLevel.FATAL,
        type: CrashType.CHOQUE
      }
    ];

    const results = analyzeLrs(alignment, crashes, { binSizeMeters: 100 });
    const profile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: 500,
      heightScaleMetersPerUnit: 20
    });

    const firstBar = profile.bars[0];
    expect(firstBar.value).toBe(1);
    expect(firstBar.heightMeters).toBe(20);

    // El polígono debe tener 5 puntos cerrados [P_start, Q_start, Q_end, P_end, P_start]
    expect(firstBar.polygonCoordinates).toHaveLength(5);
    expect(firstBar.polygonCoordinates[0]).toEqual(firstBar.polygonCoordinates[4]);
  });

  it('debe cumplir con Test Case 6.3: Generación de Isolíneas Concéntricas de Escala', () => {
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0090 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    const results = analyzeLrs(alignment, []);
    const ticks = [25, 50, 75, 100];

    const profile = generateCurvilinearProfile(alignment, results, {
      scaleTicks: ticks
    });

    expect(profile.isolines).toHaveLength(4);
    expect(profile.isolines[0].tickValue).toBe(25);
    expect(profile.isolines[3].tickValue).toBe(100);
    expect(profile.isolines[0].lineCoordinates.length).toBeGreaterThan(1);
  });
});
