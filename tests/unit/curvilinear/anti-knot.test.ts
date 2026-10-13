import { describe, it, expect } from 'vitest';
import {
  findSegmentIntersection,
  untanglePolyline,
  smoothCoordinates
} from '../../../src/pkg/curvilinear/anti-knot.js';

describe('SPEC-20: Anti-Knot & Smoothing Algorithm', () => {
  it('detecta correctamente la intersección entre dos segmentos que se cruzan en "X"', () => {
    const p1: [number, number] = [0, 0];
    const p2: [number, number] = [2, 2];
    const p3: [number, number] = [0, 2];
    const p4: [number, number] = [2, 0];

    const inter = findSegmentIntersection(p1, p2, p3, p4);
    expect(inter).not.toBeNull();
    expect(inter![0]).toBeCloseTo(1.0, 4);
    expect(inter![1]).toBeCloseTo(1.0, 4);
  });

  it('retorna null cuando dos segmentos no se intersectan', () => {
    const p1: [number, number] = [0, 0];
    const p2: [number, number] = [1, 1];
    const p3: [number, number] = [2, 2];
    const p4: [number, number] = [3, 3];

    const inter = findSegmentIntersection(p1, p2, p3, p4);
    expect(inter).toBeNull();
  });

  it('desenreda un bucle en corbatín (nudo) eliminando la autointersección', () => {
    // Polilínea con nudo/lazo interno (autointersección entre seg 0-1 y seg 2-3)
    // P0: (0, 0) -> P1: (2, 2) -> P2: (0, 2) -> P3: (2, 0) -> P4: (4, 0)
    const knotPolyline: [number, number][] = [
      [0, 0],
      [2, 2],
      [0, 2],
      [2, 0],
      [4, 0]
    ];

    const untangled = untanglePolyline(knotPolyline);

    // Debe conservar inicio y fin
    expect(untangled[0]).toEqual([0, 0]);
    expect(untangled[untangled.length - 1]).toEqual([4, 0]);

    // Ya no debe tener autointersecciones
    let hasCross = false;
    for (let i = 0; i < untangled.length - 2; i++) {
      for (let j = i + 2; j < untangled.length - 1; j++) {
        if (findSegmentIntersection(untangled[i], untangled[i + 1], untangled[j], untangled[j + 1])) {
          hasCross = true;
        }
      }
    }
    expect(hasCross).toBe(false);
  });

  it('aplica suavizado gaussiano preservando los extremos anclados', () => {
    const coords: [number, number][] = [
      [0, 0],
      [1, 5], // Pico pronunciado
      [2, 0],
      [3, 5],
      [4, 0]
    ];

    const smoothed = smoothCoordinates(coords, 3, 1);
    expect(smoothed.length).toBe(coords.length);
    // Extremos deben ser idénticos
    expect(smoothed[0]).toEqual(coords[0]);
    expect(smoothed[smoothed.length - 1]).toEqual(coords[coords.length - 1]);

    // Los picos deben haberse atenuado
    expect(smoothed[1][1]).toBeLessThan(5);
    expect(smoothed[1][1]).toBeGreaterThan(0);
  });
});
