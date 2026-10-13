/**
 * Adaptador de Capas y Fuentes Geoespaciales para MapLibre GL JS
 * Conforme a SPEC-04 y SPEC-07 (pkg/viz)
 */

import { Alignment } from '../tracer/types.js';
import { LrsAnalysisResult } from '../lrs/types.js';
import { extractSubLineString } from '../export/geojson.js';
import { generateBufferPolygonFeature } from '../tracer/buffer.js';
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
  minzoom?: number;
  maxzoom?: number;
}

export interface MapLibreAdapterOptions {
  crashPointsMinZoom?: number;
  bufferWidthMeters?: number;
}

/**
 * Genera las fuentes y capas declarativas de MapLibre GL JS para representar
 * el alineamiento, los siniestros y el tramo resaltado con alta visibilidad y contraste.
 */
export function buildMapLibreConfig(
  alignment: Alignment,
  results: LrsAnalysisResult,
  highlightedRange: [number, number] | null = null,
  options?: MapLibreAdapterOptions
): {
  sources: MapLibreGeoJsonSource[];
  layers: MapLibreLayerSpec[];
} {
  // 0. Fuente de Faja de Influencia (Buffer Vial - SPEC-22)
  const bufferWidth = options?.bufferWidthMeters ?? 25;
  const bufferData = generateBufferPolygonFeature(alignment, bufferWidth);
  const bufferSource: MapLibreGeoJsonSource = {
    id: 'source-buffer',
    type: 'geojson',
    data: bufferData
  };

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
      pointColor: SEVERITY_COLORS[p.crash.severity] || '#64748B',
      // SPEC-14: Atributos consolidados de BBDD ONSV
      vehiclesCount: p.crash.vehiclesCount ?? (p.crash.vehicles ? p.crash.vehicles.length : 1),
      personsCount: p.crash.personsCount ?? 1,
      fallecido: p.crash.personsBreakdown?.fallecido ?? (p.crash.severity === 'FATAL' ? 1 : 0),
      lesionado: p.crash.personsBreakdown?.lesionado ?? (p.crash.severity.includes('LESION') ? 1 : 0),
      noSeConoce: p.crash.personsBreakdown?.noSeConoce ?? 0,
      ileso: p.crash.personsBreakdown?.ileso ?? (p.crash.severity === 'SOLO_DANOS' ? 1 : 0),
      fecha: p.crash.fecha ?? '',
      hora: p.crash.hora ?? '',
      distrito: p.crash.distrito ?? '',
      provincia: p.crash.provincia ?? '',
      departamento: p.crash.departamento ?? '',
      roadCode: p.crash.roadCode ?? ''
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
    // 0a. Relleno Tenue de Faja de Influencia (SPEC-22)
    {
      id: 'layer-buffer-fill',
      type: 'fill',
      source: 'source-buffer',
      paint: {
        'fill-color': '#0284c7',
        'fill-opacity': 0.12
      }
    },
    // 0b. Borde Tenue Discontinuo de Faja de Influencia (SPEC-22)
    {
      id: 'layer-buffer-line',
      type: 'line',
      source: 'source-buffer',
      paint: {
        'line-color': '#0284c7',
        'line-width': 1.5,
        'line-dasharray': [3, 2],
        'line-opacity': 0.40
      }
    },
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
    // 4. Capa de Puntos de Siniestros (Círculos nítidos de 7px con borde blanco, visibles en zoom cercano - SPEC-08)
    {
      id: 'layer-crashes-points',
      type: 'circle',
      source: 'source-crashes',
      minzoom: options?.crashPointsMinZoom ?? 13.5,
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
    sources: [bufferSource, alignmentSource, crashesSource, highlightSource],
    layers
  };
}
