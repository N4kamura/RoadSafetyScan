import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import {
  generateCurvilinearProfile,
  buildBaselineArcLengthProfile,
  sampleBaselineAtArcLength
} from '../../../src/pkg/curvilinear/generator.js';
import { computePointerGeometry } from '../../../src/pkg/curvilinear/pointer.js';
import { haversineDistance } from '../../../src/pkg/tracer/geodesy.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('VisQuill Baseline Arc-Length Mapping & Distortionless Bars - SPEC-24 Compliance', () => {
  // Alineamiento con curva pronunciada de 90 grados
  const curvedAlignment = createAlignment([
    { longitude: -77.0000, latitude: -12.0100 }, // Sur
    { longitude: -77.0000, latitude: -12.0000 }, // Vértice de curva
    { longitude: -76.9900, latitude: -12.0000 }  // Este
  ]);

  it('debe cumplir con Test Case 24.1: Anclaje estricto de las bases de las barras sobre la línea base (sin brecha ni desviación)', () => {
    const crashes: CrashPoint[] = [
      {
        id: 'C-01',
        coordinates: [-77.0000, -12.0050],
        severity: SeverityLevel.FATAL,
        type: CrashType.CHOQUE
      }
    ];

    const results = analyzeLrs(curvedAlignment, crashes, { binSizeMeters: 100 });
    const profile = generateCurvilinearProfile(curvedAlignment, results, {
      offsetDistanceMeters: 600,
      side: 'RIGHT'
    });

    expect(profile.bars.length).toBeGreaterThan(0);

    // Verificar que los vértices inferiores de cada barra yacen exactamente sobre los puntos interpolados de la baseline
    for (const bar of profile.bars) {
      const pStart = bar.polygonCoordinates[0];
      const pEnd = bar.polygonCoordinates[3];

      // Ambos puntos deben tener coordenadas válidas
      expect(pStart).toBeDefined();
      expect(pEnd).toBeDefined();

      // La distancia mínima desde pStart a algún vértice o segmento de la línea base debe ser virtualmente cero
      const minDistanceToBaselineStart = Math.min(
        ...profile.baselineCoordinates.map((c) =>
          haversineDistance(
            { longitude: pStart[0], latitude: pStart[1] },
            { longitude: c[0], latitude: c[1] }
          )
        )
      );

      // Dado el muestreo fino, la distancia al vértice más cercano debe ser muy pequeña (< 40m en paso de muestreo)
      expect(minDistanceToBaselineStart).toBeLessThan(50);
    }
  });

  it('debe cumplir con Test Case 24.2: Supresión estricta de barras en tramos sin siniestros (Zero-Value Suppression)', () => {
    // Eje recto de 1,500 m (15 bins de 100 m)
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0150 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    // Solo dos siniestros en bins específicos (ej. bin 2 y bin 8)
    const crashes: CrashPoint[] = [
      {
        id: 'C-BIN2',
        coordinates: [-77.0000, -12.0130], // ~222 m
        severity: SeverityLevel.LESIONES_GRAVES,
        type: CrashType.CHOQUE
      },
      {
        id: 'C-BIN8',
        coordinates: [-77.0000, -12.0070], // ~889 m
        severity: SeverityLevel.FATAL,
        type: CrashType.ATROPELLO
      }
    ];

    const results = analyzeLrs(alignment, crashes, { binSizeMeters: 100 });
    const profile = generateCurvilinearProfile(alignment, results, {
      offsetDistanceMeters: 500,
      metricMode: 'COUNT'
    });

    // En la versión anterior se generaban 15 barras (13 de ellas vacías con altura 0).
    // Con SPEC-24, solo deben existir EXACTAMENTE las barras con siniestros (> 0).
    expect(profile.bars.length).toBe(2);
    expect(profile.bars.every((b) => b.value > 0)).toBe(true);
    expect(profile.bars.every((b) => b.heightMeters > 0)).toBe(true);

    // La línea base debe permanecer completa para todo el tramo
    expect(profile.baselineCoordinates.length).toBeGreaterThan(10);
  });

  it('debe cumplir con Test Case 24.3: Mapeo por longitud de arco de la línea base proporcional al eje vial', () => {
    // Polilínea base de prueba
    const rawCoords: [number, number][] = [
      [-77.0000, -12.0000],
      [-77.0000, -12.0050],
      [-77.0000, -12.0100]
    ];

    const profile = buildBaselineArcLengthProfile(rawCoords, 'RIGHT');
    expect(profile.totalLength).toBeGreaterThan(1000);
    expect(profile.cumulativeDistances).toHaveLength(3);
    expect(profile.cumulativeDistances[0]).toBe(0);
    expect(profile.cumulativeDistances[2]).toBe(profile.totalLength);

    // Muestreo a la mitad del arco u = 0.5 * totalLength
    const midSample = sampleBaselineAtArcLength(profile, profile.totalLength * 0.5);
    expect(midSample.coord[1]).toBeCloseTo(-12.0050, 4);

    // El vector normal debe ser unitario
    const normLen = Math.hypot(midSample.normal.x, midSample.normal.y);
    expect(normLen).toBeCloseTo(1.0, 5);
  });

  it('debe cumplir con Test Case 24.4: Estabilidad geométrica y caras laterales no invertidas en curvas', () => {
    // Eje en curva donde se colocan múltiples siniestros contiguos
    const crashes: CrashPoint[] = [
      { id: 'C1', coordinates: [-77.0000, -12.0020], severity: SeverityLevel.FATAL, type: CrashType.CHOQUE },
      { id: 'C2', coordinates: [-77.0000, -12.0010], severity: SeverityLevel.FATAL, type: CrashType.CHOQUE },
      { id: 'C3', coordinates: [-76.9950, -12.0000], severity: SeverityLevel.FATAL, type: CrashType.CHOQUE }
    ];

    const results = analyzeLrs(curvedAlignment, crashes, { binSizeMeters: 100 });
    const profile = generateCurvilinearProfile(curvedAlignment, results, {
      offsetDistanceMeters: 400,
      heightScaleMetersPerUnit: 30,
      side: 'RIGHT'
    });

    expect(profile.bars.length).toBeGreaterThan(0);

    for (const bar of profile.bars) {
      // Un polígono de barra bien formado tiene 5 puntos: [P_start, Q_start, Q_end, P_end, P_start]
      const [pStart, qStart, qEnd, pEnd, pClose] = bar.polygonCoordinates;
      expect(pStart).toEqual(pClose);

      // La distancia de extrusión P_start -> Q_start debe ser ~ bar.heightMeters
      const extDistStart = haversineDistance(
        { longitude: pStart[0], latitude: pStart[1] },
        { longitude: qStart[0], latitude: qStart[1] }
      );
      expect(extDistStart).toBeCloseTo(bar.heightMeters, 0);

      // La distancia de extrusión P_end -> Q_end debe ser ~ bar.heightMeters
      const extDistEnd = haversineDistance(
        { longitude: pEnd[0], latitude: pEnd[1] },
        { longitude: qEnd[0], latitude: qEnd[1] }
      );
      expect(extDistEnd).toBeCloseTo(bar.heightMeters, 0);

      // Los puntos superiores qStart y qEnd no deben coincidir (ancho positivo no nulo)
      const topWidth = haversineDistance(
        { longitude: qStart[0], latitude: qStart[1] },
        { longitude: qEnd[0], latitude: qEnd[1] }
      );
      expect(topWidth).toBeGreaterThan(10);
    }
  });

  it('debe cumplir con Test Case 24.5: Línea conectora del puntero une progresiva vial con punto de arco de la línea base', () => {
    const s = 500;
    const results = analyzeLrs(curvedAlignment, []);
    const profile = generateCurvilinearProfile(curvedAlignment, results, {
      offsetDistanceMeters: 600,
      side: 'RIGHT'
    });

    const pointerGeom = computePointerGeometry(
      curvedAlignment,
      s,
      600,
      'RIGHT',
      3,
      profile.baselineProfile
    );

    expect(pointerGeom.chainageMeters).toBe(500);
    expect(pointerGeom.connectorLineCoordinates).toHaveLength(2);

    const roadPt = pointerGeom.connectorLineCoordinates[0];
    const baselinePt = pointerGeom.connectorLineCoordinates[1];

    expect(roadPt).toEqual(pointerGeom.roadCoord);
    expect(baselinePt).toEqual(pointerGeom.baselineCoord);

    // El punto de la línea base debe estar a ~600 metros de la carretera
    const connectorLength = haversineDistance(
      { longitude: roadPt[0], latitude: roadPt[1] },
      { longitude: baselinePt[0], latitude: baselinePt[1] }
    );
    expect(connectorLength).toBeGreaterThan(500);
    expect(connectorLength).toBeLessThan(700);
  });
});
