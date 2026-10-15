import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import {
  generateCurvilinearProfile,
  sampleBaselineAtStation
} from '../../../src/pkg/curvilinear/generator.js';
import { haversineDistance } from '../../../src/pkg/tracer/geodesy.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('Globally-Stable Baseline with Curved Arc Transitions & Anti-Rotation - SPEC-32 Compliance', () => {
  // Alineamiento con tramo central recto y curvas pronunciadas en ambos extremos (similar a la A1 UK)
  const corridorAlignment = createAlignment([
    { longitude: -77.0200, latitude: -12.0000 }, // Extremo inicial curvo oeste
    { longitude: -77.0100, latitude: -12.0080 }, // Transición
    { longitude: -77.0000, latitude: -12.0150 }, // Cuerpo central rectilíneo
    { longitude: -77.0000, latitude: -12.0350 }, // Cuerpo central rectilíneo
    { longitude: -76.9850, latitude: -12.0450 }  // Extremo terminal curvo este (~5.8 km)
  ]);

  const offsetDist = 600;

  it('debe cumplir con Test Case 32.1: Garantía Antigiro estricta (invarianza angular) al desplazar el viewport', () => {
    const results = analyzeLrs(corridorAlignment, []);

    // Simular tres viewports resultantes del paneo a lo largo del cuerpo rectilíneo del corredor
    const viewport1 = generateCurvilinearProfile(corridorAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      visibleRange: [2800, 4400]
    });

    const viewport2 = generateCurvilinearProfile(corridorAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      visibleRange: [2900, 4500]
    });

    const viewport3 = generateCurvilinearProfile(corridorAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      visibleRange: [3000, 4600]
    });

    // Progresiva compartida en el centro de los viewports: s = 3,700 m
    const testStation = 3700;
    const pt1 = sampleBaselineAtStation(viewport1.baselineProfile!, testStation);
    const pt2 = sampleBaselineAtStation(viewport2.baselineProfile!, testStation);
    const pt3 = sampleBaselineAtStation(viewport3.baselineProfile!, testStation);

    // 1. Las coordenadas en el mapa sobre el tramo rectilíneo deben ser colineales y estables
    const dist12 = haversineDistance(
      { longitude: pt1.coord[0], latitude: pt1.coord[1] },
      { longitude: pt2.coord[0], latitude: pt2.coord[1] }
    );
    const dist23 = haversineDistance(
      { longitude: pt2.coord[0], latitude: pt2.coord[1] },
      { longitude: pt3.coord[0], latitude: pt3.coord[1] }
    );
    expect(dist12).toBeLessThan(0.001);
    expect(dist23).toBeLessThan(0.001);

    // 2. Los vectores normales deben ser IDÉNTICOS (rotación 0.0 grados al hacer pan)
    expect(pt1.normal.x).toBeCloseTo(pt2.normal.x, 6);
    expect(pt1.normal.y).toBeCloseTo(pt2.normal.y, 6);
    expect(pt2.normal.x).toBeCloseTo(pt3.normal.x, 6);
    expect(pt2.normal.y).toBeCloseTo(pt3.normal.y, 6);
  });

  it('debe cumplir con Test Case 32.2: Bordes curvos continuos en los extremos del corredor (SPEC-32)', () => {
    const results = analyzeLrs(corridorAlignment, []);
    const profile = generateCurvilinearProfile(corridorAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      borderCurvatureRatio: 0.15
    });

    const totalLen = corridorAlignment.totalLength;
    const bp = profile.baselineProfile!;

    // Punto en extremo inicial (tau = 0.02) vs Punto en cuerpo central (tau = 0.5)
    const sStart = totalLen * 0.02;
    const sMid = totalLen * 0.50;
    const sEnd = totalLen * 0.98;

    const ptStart = sampleBaselineAtStation(bp, sStart);
    const ptMid = sampleBaselineAtStation(bp, sMid);
    const ptEnd = sampleBaselineAtStation(bp, sEnd);

    // En los extremos curvos, la normal diverge suavemente de la normal central global
    const dotProductStart = ptStart.normal.x * ptMid.normal.x + ptStart.normal.y * ptMid.normal.y;
    const dotProductEnd = ptEnd.normal.x * ptMid.normal.x + ptEnd.normal.y * ptMid.normal.y;

    // El producto punto < 0.999 confirma que los bordes presentan curvatura suave (arcos en los extremos)
    expect(dotProductStart).toBeLessThan(0.999);
    expect(dotProductEnd).toBeLessThan(0.999);
  });

  it('debe cumplir con Test Case 32.3: Cuerpo central estrictamente rectilíneo con normales constantes', () => {
    const results = analyzeLrs(corridorAlignment, []);
    const profile = generateCurvilinearProfile(corridorAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      borderCurvatureRatio: 0.15
    });

    const totalLen = corridorAlignment.totalLength;
    const bp = profile.baselineProfile!;

    // Evaluar varios puntos dentro del cuerpo central [0.25 L, 0.75 L]
    const s1 = totalLen * 0.30;
    const s2 = totalLen * 0.50;
    const s3 = totalLen * 0.70;

    const pt1 = sampleBaselineAtStation(bp, s1);
    const pt2 = sampleBaselineAtStation(bp, s2);
    const pt3 = sampleBaselineAtStation(bp, s3);

    // En el cuerpo central, la normal debe ser idéntica y constante
    expect(pt1.normal.x).toBeCloseTo(pt2.normal.x, 5);
    expect(pt1.normal.y).toBeCloseTo(pt2.normal.y, 5);
    expect(pt2.normal.x).toBeCloseTo(pt3.normal.x, 5);
    expect(pt2.normal.y).toBeCloseTo(pt3.normal.y, 5);
  });

  it('debe cumplir con Test Case 32.4: Isolíneas de escala concéntricas a distancia métrica constante', () => {
    const results = analyzeLrs(corridorAlignment, []);
    const profile = generateCurvilinearProfile(corridorAlignment, results, {
      offsetDistanceMeters: offsetDist,
      side: 'RIGHT',
      scaleTicks: [15, 30, 45, 60],
      heightScaleMetersPerUnit: 30
    });

    expect(profile.isolines).toHaveLength(4);

    for (const iso of profile.isolines) {
      // Verificar que la distancia entre cada punto de la baseline y la isolínea correspondiente es exactamente iso.heightMeters
      const midIdx = Math.floor(profile.baselineCoordinates.length / 2);
      const bCoord = profile.baselineCoordinates[midIdx];
      const iCoord = iso.lineCoordinates[midIdx];

      const dist = haversineDistance(
        { longitude: bCoord[0], latitude: bCoord[1] },
        { longitude: iCoord[0], latitude: iCoord[1] }
      );

      expect(dist).toBeCloseTo(iso.heightMeters, 0);
    }
  });
});
