import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { projectCrashOnAlignment } from '../../../src/pkg/lrs/projection.js';
import { CrashPoint, SeverityLevel, CrashType, RoadSide } from '../../../src/pkg/lrs/types.js';

describe('LRS Orthogonal Projection Engine (pkg/lrs) - SPEC-03 Compliance', () => {
  it('debe cumplir con Test Case 3.1: Proyección exacta sobre el eje', () => {
    // Eje recto de Sur a Norte (1 km aprox)
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0090 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    // Siniestro situado exactamente a la mitad del eje
    const midLat = -12.0045;
    const crash: CrashPoint = {
      id: 'TEST-CRASH-01',
      coordinates: [-77.0000, midLat],
      severity: SeverityLevel.FATAL,
      type: CrashType.CHOQUE
    };

    const projected = projectCrashOnAlignment(crash, alignment, 25);

    expect(projected.lateralDistanceMeters).toBeLessThanOrEqual(0.05);
    expect(projected.side).toBe(RoadSide.CENTER);
    expect(projected.chainageMeters).toBeCloseTo(alignment.totalLength / 2, 0);
    expect(projected.isInsideBuffer).toBe(true);
  });

  it('debe cumplir con Test Case 3.2: Detección precisa de margen izquierda y derecha', () => {
    // Eje que avanza de Sur a Norte
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0100 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    // Punto desplazado al Este (Derecha del sentido de avance Sur -> Norte)
    // 0.00015 grados lon en lat -12° son ~16.3 metros
    const crashRight: CrashPoint = {
      id: 'CRASH-RIGHT',
      coordinates: [-76.99985, -12.0050],
      severity: SeverityLevel.LESIONES_GRAVES,
      type: CrashType.ATROPELLO
    };

    // Punto desplazado al Oeste (Izquierda del sentido de avance Sur -> Norte)
    const crashLeft: CrashPoint = {
      id: 'CRASH-LEFT',
      coordinates: [-77.00015, -12.0050],
      severity: SeverityLevel.SOLO_DANOS,
      type: CrashType.CHOQUE
    };

    const projRight = projectCrashOnAlignment(crashRight, alignment, 25);
    const projLeft = projectCrashOnAlignment(crashLeft, alignment, 25);

    expect(projRight.side).toBe(RoadSide.RIGHT);
    expect(projRight.signedLateralDistanceMeters).toBeGreaterThan(0);
    expect(projRight.lateralDistanceMeters).toBeGreaterThan(14);
    expect(projRight.lateralDistanceMeters).toBeLessThan(18);

    expect(projLeft.side).toBe(RoadSide.LEFT);
    expect(projLeft.signedLateralDistanceMeters).toBeLessThan(0);
    expect(projLeft.lateralDistanceMeters).toBeGreaterThan(14);
    expect(projLeft.lateralDistanceMeters).toBeLessThan(18);
  });

  it('debe cumplir con Test Case 3.3: Exclusión de siniestro fuera de buffer', () => {
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0100 },
      { longitude: -77.0000, latitude: -12.0000 }
    ]);

    // Punto desplazado ~35 metros al Este
    const crashFar: CrashPoint = {
      id: 'CRASH-FAR',
      coordinates: [-76.99968, -12.0050],
      severity: SeverityLevel.SOLO_DANOS,
      type: CrashType.DESPISTE
    };

    // Buffer de 20 metros
    const projected = projectCrashOnAlignment(crashFar, alignment, 20);

    expect(projected.lateralDistanceMeters).toBeGreaterThan(30);
    expect(projected.isInsideBuffer).toBe(false);
  });

  it('debe proyectar correctamente en alineamiento multi-segmento con curva', () => {
    const alignment = createAlignment([
      { longitude: -77.0000, latitude: -12.0100 }, // Inicio
      { longitude: -77.0000, latitude: -12.0050 }, // Vértice 1
      { longitude: -76.9950, latitude: -12.0000 }  // Vértice 2 (giro a Noreste)
    ]);

    // Siniestro en el segundo segmento
    const crashSeg1: CrashPoint = {
      id: 'CRASH-SEG-1',
      coordinates: [-76.9975, -12.0025],
      severity: SeverityLevel.FATAL,
      type: CrashType.VOLCADURA
    };

    const projected = projectCrashOnAlignment(crashSeg1, alignment, 30);

    expect(projected.segmentIndex).toBe(1);
    expect(projected.chainageMeters).toBeGreaterThan(alignment.segments[0].length);
    expect(projected.lateralDistanceMeters).toBeLessThan(5);
  });
});
