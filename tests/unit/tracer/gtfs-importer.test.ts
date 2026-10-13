import { describe, it, expect } from 'vitest';
import {
  parseCsvLine,
  parseGtfsRoutes,
  parseGtfsShapes,
  parseGtfsAlignments
} from '../../../src/pkg/tracer/importers/gtfs.js';

describe('GTFS Importer (pkg/tracer) - SPEC-15 Compliance', () => {
  const sampleRoutesTxt = `route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_color,route_text_color
PE-1S,MTC,"PE-1S","Corredor Panamericana Sur (Km 18 al 25)","Carretera Panamericana Sur",3,2563EB,FFFFFF
PE-1N,MTC,"PE-1N","Corredor Panamericana Norte (Km 35 al 41)","Carretera Panamericana Norte",3,10B981,FFFFFF`;

  const sampleShapesTxt = `shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled
PE-1S,-12.180000,-76.960000,1,0.00
PE-1S,-12.185000,-76.958000,2,596.96
PE-1S,-12.192000,-76.955000,3,1440.86
PE-1N,-11.780000,-77.175000,1,0.00
PE-1N,-11.765000,-77.169000,2,1791.25`;

  it('debe parsear líneas CSV con comillas correctamente', () => {
    const parsed = parseCsvLine('PE-1S,MTC,"PE-1S","Panamericana, Sur",3,2563EB');
    expect(parsed).toEqual(['PE-1S', 'MTC', 'PE-1S', 'Panamericana, Sur', '3', '2563EB']);
  });

  it('debe parsear las rutas en routes.txt', () => {
    const routes = parseGtfsRoutes(sampleRoutesTxt);
    expect(routes).toHaveLength(2);
    expect(routes[0].route_id).toBe('PE-1S');
    expect(routes[0].route_color).toBe('#2563EB');
    expect(routes[0].route_long_name).toBe('Corredor Panamericana Sur (Km 18 al 25)');
    expect(routes[1].route_id).toBe('PE-1N');
    expect(routes[1].route_color).toBe('#10B981');
  });

  it('debe parsear y agrupar shapes.txt por shape_id', () => {
    const shapes = parseGtfsShapes(sampleShapesTxt);
    expect(shapes.has('PE-1S')).toBe(true);
    expect(shapes.has('PE-1N')).toBe(true);
    expect(shapes.get('PE-1S')).toHaveLength(3);
    expect(shapes.get('PE-1N')).toHaveLength(2);
    expect(shapes.get('PE-1S')![0].shape_pt_lat).toBe(-12.18);
    expect(shapes.get('PE-1S')![0].shape_pt_lon).toBe(-76.96);
  });

  it('debe construir objetos Alignment válidos a partir de routes.txt y shapes.txt', () => {
    const alignments = parseGtfsAlignments(sampleRoutesTxt, sampleShapesTxt);
    expect(alignments).toHaveLength(2);

    const alSur = alignments.find(a => a.id === 'PE-1S');
    expect(alSur).toBeDefined();
    expect(alSur!.vertices).toHaveLength(3);
    expect(alSur!.color).toBe('#2563EB');
    expect(alSur!.totalLength).toBeGreaterThan(1400);

    const alNorte = alignments.find(a => a.id === 'PE-1N');
    expect(alNorte).toBeDefined();
    expect(alNorte!.vertices).toHaveLength(2);
    expect(alNorte!.color).toBe('#10B981');
  });
});
