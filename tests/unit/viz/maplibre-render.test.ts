import { describe, it, expect } from 'vitest';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';
import { analyzeLrs } from '../../../src/pkg/lrs/aggregator.js';
import { buildMapLibreConfig } from '../../../src/pkg/viz/maplibre-adapter.js';
import { generateCurvilinearProfile } from '../../../src/pkg/curvilinear/generator.js';
import { buildCurvilinearMapLibreLayers } from '../../../src/pkg/curvilinear/maplibre-layers.js';
import { CrashPoint, SeverityLevel, CrashType } from '../../../src/pkg/lrs/types.js';

describe('MapLibre Render Pipeline & Diagnostics (pkg/viz) - SPEC-07 Compliance', () => {
  const alignment = createAlignment([
    { longitude: -76.9600, latitude: -12.1800 },
    { longitude: -76.9450, latitude: -12.2100 },
    { longitude: -76.9300, latitude: -12.2420 }
  ]);

  const crashes: CrashPoint[] = [
    {
      id: 'CRASH-01',
      coordinates: [-76.9550, -12.1900],
      severity: SeverityLevel.FATAL,
      type: CrashType.CHOQUE
    },
    {
      id: 'CRASH-02',
      coordinates: [-76.9400, -12.2200],
      severity: SeverityLevel.LESIONES_GRAVES,
      type: CrashType.DESPISTE
    },
    {
      id: 'CRASH-03',
      coordinates: [-76.9350, -12.2300],
      severity: SeverityLevel.SOLO_DANOS,
      type: CrashType.CHOQUE
    }
  ];

  it('debe cumplir con Test Case 7.1: Conformidad GeoJSON (evitar geometrías vacías inválidas RFC 7946)', () => {
    const results = analyzeLrs(alignment, crashes);

    // 1. Sin rango resaltado (estado inicial): source-highlight debe ser FeatureCollection vacía válida
    const configInitial = buildMapLibreConfig(alignment, results, null);
    const highlightSrcInitial = configInitial.sources.find((s) => s.id === 'source-highlight');

    expect(highlightSrcInitial).toBeDefined();
    expect(highlightSrcInitial?.data.type).toBe('FeatureCollection');
    expect(highlightSrcInitial?.data.features).toEqual([]);

    // 2. Con rango resaltado válido (e.g. [200, 600]): source-highlight debe ser LineString con >= 2 coordenadas
    const configActive = buildMapLibreConfig(alignment, results, [200, 600]);
    const highlightSrcActive = configActive.sources.find((s) => s.id === 'source-highlight');

    expect(highlightSrcActive).toBeDefined();
    expect(highlightSrcActive?.data.type).toBe('Feature');
    expect(highlightSrcActive?.data.geometry.type).toBe('LineString');
    expect(highlightSrcActive?.data.geometry.coordinates.length).toBeGreaterThanOrEqual(2);
  });

  it('debe cumplir con Test Case 7.2: Jerarquía de Capas de Alto Contraste (Casing y Puntos Nítidos)', () => {
    const results = analyzeLrs(alignment, crashes);
    const config = buildMapLibreConfig(alignment, results);

    // Debe contener casing inferior y línea central de alta visibilidad
    const layerCasing = config.layers.find((l) => l.id === 'layer-alignment-casing');
    const layerLine = config.layers.find((l) => l.id === 'layer-alignment-line');
    const layerCrashes = config.layers.find((l) => l.id === 'layer-crashes-points');

    expect(layerCasing).toBeDefined();
    expect(layerCasing?.paint['line-width']).toBe(8);

    expect(layerLine).toBeDefined();
    expect(layerLine?.paint['line-width']).toBe(4.5);
    expect(layerLine?.paint['line-color']).toBe('#0284C7');

    // Capa de puntos de siniestros con borde blanco y radio ampliado
    expect(layerCrashes).toBeDefined();
    expect(layerCrashes?.paint['circle-radius']).toBe(7);
    expect(layerCrashes?.paint['circle-stroke-width']).toBe(2);
    expect(layerCrashes?.paint['circle-stroke-color']).toBe('#FFFFFF');
    expect(layerCrashes?.paint['circle-color']).toEqual(['get', 'pointColor']);
  });

  it('debe cumplir con Test Case 7.3: Mapeo Completo de Puntos de Siniestros y Perfil Curvilíneo', () => {
    const results = analyzeLrs(alignment, crashes);
    const corridorConfig = buildMapLibreConfig(alignment, results);

    const crashSource = corridorConfig.sources.find((s) => s.id === 'source-crashes');
    expect(crashSource).toBeDefined();
    expect(crashSource?.data.features).toHaveLength(3);

    // Verificar que cada punto tiene su propiedad pointColor correspondiente a su severidad MTC
    const fatalFeature = crashSource?.data.features.find((f: any) => f.properties.id === 'CRASH-01');
    expect(fatalFeature?.properties.pointColor).toBe('#DC2626');
    expect(fatalFeature?.geometry.coordinates).toEqual([-76.9550, -12.1900]);

    // Verificar que el generador curvilíneo también produce el bundle completo de capas
    const curvModel = generateCurvilinearProfile(alignment, results);
    const curvBundle = buildCurvilinearMapLibreLayers(curvModel);

    expect(curvBundle.sources.length).toBeGreaterThanOrEqual(4);
    expect(curvBundle.layers.some((l) => l.id === 'layer-curvilinear-bars-fill')).toBe(true);
    expect(curvBundle.layers.some((l) => l.id === 'layer-curvilinear-baseline')).toBe(true);
    expect(curvBundle.layers.some((l) => l.id === 'layer-curvilinear-isolines')).toBe(true);
  });

  it('debe cumplir con SPEC-08: Visibilidad de Puntos de Accidentes según Zoom (minzoom >= 13.5)', () => {
    const results = analyzeLrs(alignment, crashes);

    // Por defecto, minzoom debe ser 13.5
    const defaultConfig = buildMapLibreConfig(alignment, results);
    const defaultLayer = defaultConfig.layers.find((l) => l.id === 'layer-crashes-points');
    expect(defaultLayer).toBeDefined();
    expect(defaultLayer?.minzoom).toBe(13.5);

    // Personalizado mediante opciones
    const customConfig = buildMapLibreConfig(alignment, results, null, { crashPointsMinZoom: 14.0 });
    const customLayer = customConfig.layers.find((l) => l.id === 'layer-crashes-points');
    expect(customLayer).toBeDefined();
    expect(customLayer?.minzoom).toBe(14.0);
  });
});
