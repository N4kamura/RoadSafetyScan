/**
 * Adaptador de Capas MapLibre GL JS para el Perfil Curvilíneo
 * Conforme a SPEC-06 (pkg/curvilinear) - Paradigma VisQuill GDK A1 Collision Density
 */

import { CurvilinearProfileModel } from './types.js';

export interface MapLibreCurvilinearBundle {
  sources: {
    id: string;
    type: 'geojson';
    data: any;
  }[];
  layers: any[];
}

/**
 * Convierte un modelo CurvilinearProfileModel en fuentes y capas GeoJSON nativas de MapLibre GL JS
 *
 * @param model Modelo geométrico curvilíneo
 * @param activeBinIndex Índice del bin actualmente en hover o selección
 * @returns Fuentes y capas listas para map.addSource / map.addLayer
 */
export function buildCurvilinearMapLibreLayers(
  model: CurvilinearProfileModel,
  activeBinIndex: number | null = null
): MapLibreCurvilinearBundle {
  // 1. Fuente de Barras Poligonales
  const barFeatures = model.bars.map((bar) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [bar.polygonCoordinates]
    },
    properties: {
      binIndex: bar.binIndex,
      startStation: bar.startStationFormatted,
      endStation: bar.endStationFormatted,
      value: bar.value,
      heightMeters: bar.heightMeters,
      fatalCount: bar.severityBreakdown.fatal,
      graveCount: bar.severityBreakdown.grave,
      leveCount: bar.severityBreakdown.leve,
      danosCount: bar.severityBreakdown.danos,
      isHovered: activeBinIndex === bar.binIndex,
      // SPEC-14:
      totalVehicles: bar.totalVehicles ?? 0,
      totalPersons: bar.totalPersons ?? 0,
      fallecido: bar.personsBreakdown?.fallecido ?? bar.severityBreakdown.fatal,
      lesionado: bar.personsBreakdown?.lesionado ?? (bar.severityBreakdown.grave + bar.severityBreakdown.leve),
      noSeConoce: bar.personsBreakdown?.noSeConoce ?? 0,
      ileso: bar.personsBreakdown?.ileso ?? bar.severityBreakdown.danos,
      // Color según severidad dominante o púrpura VisQuill por defecto
      barColor: bar.severityBreakdown.fatal > 0
        ? '#DC2626'
        : bar.severityBreakdown.grave > 0
        ? '#EA580C'
        : bar.severityBreakdown.leve > 0
        ? '#FACC15'
        : bar.value > 0
        ? '#7C3AED' // Púrpura VisQuill de referencia
        : 'rgba(124, 58, 237, 0.15)' // Tenue si no hay incidentes
    }
  }));

  const barsSource = {
    id: 'source-curvilinear-bars',
    type: 'geojson' as const,
    data: {
      type: 'FeatureCollection',
      features: barFeatures
    }
  };

  // 2. Fuente de la Línea Base Desplazada B(s)
  const baselineSource = {
    id: 'source-curvilinear-baseline',
    type: 'geojson' as const,
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: model.baselineCoordinates
      },
      properties: {}
    }
  };

  // 3. Fuente de Isolíneas Concéntricas de Escala
  const isolineFeatures = model.isolines.map((iso) => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: iso.lineCoordinates
    },
    properties: {
      tickValue: iso.tickValue,
      label: String(iso.tickValue)
    }
  }));

  const isolinesSource = {
    id: 'source-curvilinear-isolines',
    type: 'geojson' as const,
    data: {
      type: 'FeatureCollection',
      features: isolineFeatures
    }
  };

  // 4. Fuente de Rayos Conectores Transversales
  const connectorFeatures = model.connectorLines.map((line) => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: line
    },
    properties: {}
  }));

  const connectorsSource = {
    id: 'source-curvilinear-connectors',
    type: 'geojson' as const,
    data: {
      type: 'FeatureCollection',
      features: connectorFeatures
    }
  };

  // 5. Fuente de Etiquetas Numéricas de Escala
  const labelFeatures = model.isolines.map((iso) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: iso.labelPosition
    },
    properties: {
      label: String(iso.tickValue)
    }
  }));

  const labelsSource = {
    id: 'source-curvilinear-labels',
    type: 'geojson' as const,
    data: {
      type: 'FeatureCollection',
      features: labelFeatures
    }
  };

  // Definición de Capas Visuales MapLibre
  const layers = [
    // Relleno de las Barras del Perfil
    {
      id: 'layer-curvilinear-bars-fill',
      type: 'fill',
      source: 'source-curvilinear-bars',
      paint: {
        'fill-color': ['get', 'barColor'],
        'fill-opacity': [
          'case',
          ['get', 'isHovered'],
          1.0,
          0.85
        ]
      }
    },
    // Contorno de las Barras
    {
      id: 'layer-curvilinear-bars-stroke',
      type: 'line',
      source: 'source-curvilinear-bars',
      paint: {
        'line-color': [
          'case',
          ['get', 'isHovered'],
          '#10B981', // Verde resaltado al interactuar
          '#4C1D95'
        ],
        'line-width': [
          'case',
          ['get', 'isHovered'],
          2.5,
          0.8
        ]
      }
    },
    // Isolíneas Concéntricas de Escala (Arcos)
    {
      id: 'layer-curvilinear-isolines',
      type: 'line',
      source: 'source-curvilinear-isolines',
      paint: {
        'line-color': '#64748B',
        'line-width': 1.2,
        'line-dasharray': [3, 2],
        'line-opacity': 0.75
      }
    },
    // Rayos Transversales Conectores
    {
      id: 'layer-curvilinear-connectors',
      type: 'line',
      source: 'source-curvilinear-connectors',
      paint: {
        'line-color': '#94A3B8',
        'line-width': 1.2,
        'line-opacity': 0.8
      }
    },
    // Línea Base Desplazada B(s)
    {
      id: 'layer-curvilinear-baseline',
      type: 'line',
      source: 'source-curvilinear-baseline',
      paint: {
        'line-color': '#1E293B',
        'line-width': 2.5
      }
    },
    // Etiquetas Numéricas de Escala
    {
      id: 'layer-curvilinear-labels',
      type: 'symbol',
      source: 'source-curvilinear-labels',
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 11,
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-offset': [0, 0.5],
        'text-anchor': 'top'
      },
      paint: {
        'text-color': '#475569',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    }
  ];

  return {
    sources: [
      barsSource,
      baselineSource,
      isolinesSource,
      connectorsSource,
      labelsSource
    ],
    layers
  };
}
