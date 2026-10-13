/**
 * Adaptador de Capas y Fuentes Geoespaciales para MapLibre GL JS
 * Conforme a SPEC-04 y SPEC-07 (pkg/viz)
 */

import { Alignment } from '../tracer/types.js';
import { LrsAnalysisResult } from '../lrs/types.js';
import { extractSubLineString } from '../export/geojson.js';
import {
  SEVERITY_COLORS,
  HIGHLIGHT_COLOR
} from './types.js';

export interface MapLibreGeoJsonSource {
  id: string;
  type: 'geojson';
  data: any;
}

export interface MapLibreLayerSpec {
  id: string;
  type: 'line' | 'circle' | 'fill' | 'symbol';
  source: string;
  paint: Record<string, any>;
  layout?: Record<string, any>;
}

/**
 * Genera las fuentes y capas declarativas de MapLibre GL JS para representar
 * el alineamiento, los siniestros y el tramo resaltado con alta visibilidad y contraste.
 */
export function buildMapLibreConfig(
  alignment: Alignment,
  results: LrsAnalysisResult,
  highlightedRange: [number, number] | null = null
): {
  sources: MapLibreGeoJsonSource[];
  layers: MapLibreLayerSpec[];
} {
  // 1. Fuente del Eje Vial
  const alignmentCoordinates = alignment.vertices.map((v) => [
    v.coordinates.longitude,
    v.coordinates.latitude
  ]);

  const alignmentSource: MapLibreGeoJsonSource = {
    id: 'source-alignment',
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: alignmentCoordinates
      },
      properties: {
        id: alignment.id,
        name: alignment.name
      }
    }
  };

  // 2. Fuente de Siniestros (Puntos)
  const crashFeatures = results.projectedCrashes.map((p) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [p.crash.coordinates[0], p.crash.coordinates[1]]
    },
    properties: {
      id: String(p.crash.id),
      severity: p.crash.severity,
      type: p.crash.type,
      station: p.stationFormatted,
      isInsideBuffer: p.isInsideBuffer,
      pointColor: SEVERITY_COLORS[p.crash.severity] || '#64748B'
    }
  }));

  const crashesSource: MapLibreGeoJsonSource = {
    id: 'source-crashes',
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: crashFeatures
    }
  };

  // 3. Fuente de Tramo Resaltado (Hover / Selección)
  let highlightCoords: [number, number][] = [];
  if (highlightedRange) {
    highlightCoords = extractSubLineString(
      alignment,
      highlightedRange[0],
      highlightedRange[1]
    );
  }

  // Si no hay tramo activo o menos de 2 puntos, usar FeatureCollection vacía válida (RFC 7946)
  const highlightData = highlightCoords.length >= 2
    ? {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: highlightCoords
        },
        properties: {}
      }
    : {
        type: 'FeatureCollection',
        features: []
      };

  const highlightSource: MapLibreGeoJsonSource = {
    id: 'source-highlight',
    type: 'geojson',
    data: highlightData
  };

  // Capas visuales de alto contraste
  const layers: MapLibreLayerSpec[] = [
    // 1. Halo / Casing inferior del Eje Vial (para contraste sobre cualquier tesela OSM)
    {
      id: 'layer-alignment-casing',
      type: 'line',
      source: 'source-alignment',
      paint: {
        'line-color': '#0F172A',
        'line-width': 8,
        'line-opacity': 0.95
      }
    },
    // 2. Trazo central del Eje Vial (Azul vial técnico visible)
    {
      id: 'layer-alignment-line',
      type: 'line',
      source: 'source-alignment',
      paint: {
        'line-color': '#0284C7',
        'line-width': 4.5,
        'line-opacity': 1.0
      }
    },
    // 3. Franja de Resalte (Glow verde esmeralda al posar cursor sobre tramos)
    {
      id: 'layer-highlight-strip',
      type: 'line',
      source: 'source-highlight',
      paint: {
        'line-color': HIGHLIGHT_COLOR,
        'line-width': 10,
        'line-opacity': highlightCoords.length >= 2 ? 0.95 : 0.0
      }
    },
    // 4. Capa de Puntos de Siniestros (Círculos nítidos de 7px con borde blanco)
    {
      id: 'layer-crashes-points',
      type: 'circle',
      source: 'source-crashes',
      paint: {
        'circle-radius': 7,
        'circle-color': ['get', 'pointColor'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FFFFFF',
        'circle-opacity': [
          'case',
          ['get', 'isInsideBuffer'],
          1.0,
          0.4
        ]
      }
    }
  ];

  return {
    sources: [alignmentSource, crashesSource, highlightSource],
    layers
  };
}
