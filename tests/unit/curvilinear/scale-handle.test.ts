import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import {
  computePointerGeometry,
  computeScaleHandleCoordinate,
  convertDragToHeightScale,
  MIN_HEIGHT_SCALE,
  MAX_HEIGHT_SCALE
} from '../../../src/pkg/curvilinear/pointer.js';
import { haversineDistance } from '../../../src/pkg/tracer/geodesy.js';

describe('Interactive Scale Handle & Real-time Grid Extrusion (pkg/curvilinear) - SPEC-12 Compliance', () => {
  // Eje recto Sur a Norte de 2,000 m
  const alignment = createAlignment([
    { longitude: -77.0000, latitude: -12.0180 },
    { longitude: -77.0000, latitude: -12.0000 }
  ]);

  it('debe cumplir con Test Case 12.1: Posicionamiento del botón rectangular sobre la grilla a la misma progresiva s', () => {
    const s = 1000;
    const offset = 1200;
    const scale = 40; // m/u

    const pointerGeom = computePointerGeometry(alignment, s, offset, 'RIGHT');
    const scaleHandle = computeScaleHandleCoordinate(alignment, s, offset, scale, 'RIGHT');

    // Ambos botones deben estar alineados en la misma latitud (para eje Sur-Norte)
    expect(scaleHandle.handleCoord[1]).toBeCloseTo(pointerGeom.baselineCoord[1], 4);

    // El botón de escala debe encontrarse más alejado del eje vial que la baseline (hacia el Este)
    expect(scaleHandle.handleCoord[0]).toBeGreaterThan(pointerGeom.baselineCoord[0]);

    // La distancia entre la baseline y el handle debe ser proporcional a scale * 4.0 (~160 m)
    const distFromBaseline = haversineDistance(
      { longitude: pointerGeom.baselineCoord[0], latitude: pointerGeom.baselineCoord[1] },
      { longitude: scaleHandle.handleCoord[0], latitude: scaleHandle.handleCoord[1] }
    );
    expect(distFromBaseline).toBeGreaterThanOrEqual(150);
    expect(distFromBaseline).toBeLessThanOrEqual(170);
  });

  it('debe cumplir con Test Case 12.2: Variación monótona de la posición según escala (alejar = agranda, acercar = achica)', () => {
    const s = 1000;
    const offset = 1200;

    const handleSmall = computeScaleHandleCoordinate(alignment, s, offset, 20, 'RIGHT');
    const handleMedium = computeScaleHandleCoordinate(alignment, s, offset, 40, 'RIGHT');
    const handleLarge = computeScaleHandleCoordinate(alignment, s, offset, 80, 'RIGHT');

    // Mayor escala => mayor longitud (más lejos de la baseline hacia la derecha)
    expect(handleSmall.handleCoord[0]).toBeLessThan(handleMedium.handleCoord[0]);
    expect(handleMedium.handleCoord[0]).toBeLessThan(handleLarge.handleCoord[0]);
  });

  it('debe cumplir con Test Case 12.3: Límites estrictos de escala [10, 120] m/u', () => {
    const pointerGeom = computePointerGeometry(alignment, 1000, 1200, 'RIGHT');

    // Cursor arrastrado muy lejos
    const farCoord: [number, number] = [-76.9500, pointerGeom.baselineCoord[1]];
    const scaleFar = convertDragToHeightScale(
      pointerGeom.baselineCoord,
      farCoord,
      pointerGeom.normalVector,
      'RIGHT'
    );
    expect(scaleFar).toBeLessThanOrEqual(MAX_HEIGHT_SCALE);

    // Cursor arrastrado muy cerca de la baseline
    const closeCoord: [number, number] = [pointerGeom.baselineCoord[0] + 0.0001, pointerGeom.baselineCoord[1]];
    const scaleClose = convertDragToHeightScale(
      pointerGeom.baselineCoord,
      closeCoord,
      pointerGeom.normalVector,
      'RIGHT'
    );
    expect(scaleClose).toBeGreaterThanOrEqual(MIN_HEIGHT_SCALE);
  });

  it('debe calcular coordenadas en MOCK_ALIGNMENT_DATA', async () => {
    const { MOCK_ALIGNMENT_DATA } = await import('../../../src/mock-data.js');
    const alignmentCoords = MOCK_ALIGNMENT_DATA.coordinates.map((c: any) => ({ longitude: c[0], latitude: c[1] }));
    const panasur = createAlignment(alignmentCoords, MOCK_ALIGNMENT_DATA.id, MOCK_ALIGNMENT_DATA.name);
    const s = panasur.totalLength * 0.35;
    const pointerGeom = computePointerGeometry(panasur, s, 1200, 'RIGHT');
    const scaleGeom = computeScaleHandleCoordinate(panasur, s, 1200, 40, 'RIGHT');

    expect(scaleGeom.handleCoord[0]).toBeDefined();
    expect(scaleGeom.handleCoord[1]).toBeDefined();
    // La rotación del handle de escala es complementaria y alineada a las isolíneas
    expect(scaleGeom.rotationDegrees).toBeDefined();
  });
});
