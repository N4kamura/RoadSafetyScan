/**
 * Importador de Alineamientos Viales en formato GTFS (routes.txt + shapes.txt)
 * Conforme a SPEC-15 (pkg/tracer)
 */

import { GeoCoordinate, Alignment } from '../types.js';
import { createAlignment } from '../alignment.js';

export interface GtfsRouteRow {
  route_id: string;
  agency_id?: string;
  route_short_name?: string;
  route_long_name?: string;
  route_desc?: string;
  route_type?: string;
  route_color?: string;
  route_text_color?: string;
}

export interface GtfsShapePointRow {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
  shape_dist_traveled?: number;
}

/**
 * Parsea una línea de texto CSV tolerando comillas y delimitadores por coma.
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parsea el contenido de routes.txt
 */
export function parseGtfsRoutes(routesTxt: string): GtfsRouteRow[] {
  const lines = routesTxt.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
  const idIdx = headers.indexOf('route_id');
  const shortIdx = headers.indexOf('route_short_name');
  const longIdx = headers.indexOf('route_long_name');
  const descIdx = headers.indexOf('route_desc');
  const typeIdx = headers.indexOf('route_type');
  const colorIdx = headers.indexOf('route_color');
  const textIdx = headers.indexOf('route_text_color');
  const agencyIdx = headers.indexOf('agency_id');

  if (idIdx === -1) {
    throw new Error('El archivo routes.txt no contiene la columna obligatoria route_id');
  }

  const routes: GtfsRouteRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length <= idIdx || !cols[idIdx]) continue;

    routes.push({
      route_id: cols[idIdx],
      agency_id: agencyIdx !== -1 ? cols[agencyIdx] : undefined,
      route_short_name: shortIdx !== -1 ? cols[shortIdx] : undefined,
      route_long_name: longIdx !== -1 ? cols[longIdx] : undefined,
      route_desc: descIdx !== -1 ? cols[descIdx] : undefined,
      route_type: typeIdx !== -1 ? cols[typeIdx] : undefined,
      route_color: colorIdx !== -1 && cols[colorIdx] ? `#${cols[colorIdx].replace(/^#/, '')}` : undefined,
      route_text_color: textIdx !== -1 ? cols[textIdx] : undefined
    });
  }
  return routes;
}

/**
 * Parsea el contenido de shapes.txt
 */
export function parseGtfsShapes(shapesTxt: string): Map<string, GtfsShapePointRow[]> {
  const lines = shapesTxt.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const shapesMap = new Map<string, GtfsShapePointRow[]>();
  if (lines.length < 2) return shapesMap;

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
  const idIdx = headers.indexOf('shape_id');
  const latIdx = headers.indexOf('shape_pt_lat');
  const lonIdx = headers.indexOf('shape_pt_lon');
  const seqIdx = headers.indexOf('shape_pt_sequence');
  const distIdx = headers.indexOf('shape_dist_traveled');

  if (idIdx === -1 || latIdx === -1 || lonIdx === -1) {
    throw new Error('El archivo shapes.txt no contiene las columnas requeridas (shape_id, shape_pt_lat, shape_pt_lon)');
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length <= Math.max(idIdx, latIdx, lonIdx)) continue;

    const shapeId = cols[idIdx];
    const lat = parseFloat(cols[latIdx]);
    const lon = parseFloat(cols[lonIdx]);
    const seq = seqIdx !== -1 ? parseInt(cols[seqIdx], 10) : i;
    const dist = distIdx !== -1 && cols[distIdx] ? parseFloat(cols[distIdx]) : undefined;

    if (!shapeId || isNaN(lat) || isNaN(lon)) continue;

    if (!shapesMap.has(shapeId)) {
      shapesMap.set(shapeId, []);
    }
    shapesMap.get(shapeId)!.push({
      shape_id: shapeId,
      shape_pt_lat: lat,
      shape_pt_lon: lon,
      shape_pt_sequence: isNaN(seq) ? i : seq,
      shape_dist_traveled: dist
    });
  }

  // Ordenar puntos por secuencia
  for (const [_, points] of shapesMap) {
    points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
  }

  return shapesMap;
}

/**
 * Construye alineamientos a partir de routes.txt y shapes.txt
 */
export function parseGtfsAlignments(routesTxt: string, shapesTxt: string): Alignment[] {
  const routes = parseGtfsRoutes(routesTxt);
  const shapes = parseGtfsShapes(shapesTxt);

  const alignments: Alignment[] = [];

  // 1. Procesar rutas definidas en routes.txt
  for (const r of routes) {
    // Buscar forma con id igual al route_id
    const shapePoints = shapes.get(r.route_id);
    if (!shapePoints || shapePoints.length < 2) continue;

    const coordinates: GeoCoordinate[] = shapePoints.map(pt => ({
      longitude: pt.shape_pt_lon,
      latitude: pt.shape_pt_lat
    }));

    const name = r.route_long_name || r.route_short_name || r.route_id;
    const alignment = createAlignment(coordinates, r.route_id, name, {
      shortName: r.route_short_name,
      description: r.route_desc,
      color: r.route_color
    });

    alignments.push(alignment);
  }

  // 2. Si hay shapes sin entrada en routes.txt, generar alineamientos por defecto
  for (const [shapeId, points] of shapes) {
    if (alignments.some(a => a.id === shapeId) || points.length < 2) continue;

    const coordinates: GeoCoordinate[] = points.map(pt => ({
      longitude: pt.shape_pt_lon,
      latitude: pt.shape_pt_lat
    }));

    const alignment = createAlignment(coordinates, shapeId, `Trazo ${shapeId}`);
    alignments.push(alignment);
  }

  return alignments;
}
