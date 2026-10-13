import { describe, it, expect } from 'vitest';
import {
  generateGtfsRoutesTxt,
  generateGtfsShapesTxt,
  generateGtfsTripsTxt,
  generateGtfsAgencyTxt
} from '../../../src/pkg/export/gtfs.js';
import { createAlignment } from '../../../src/pkg/tracer/alignment.js';

describe('GTFS Exporter (pkg/export) - SPEC-15 Compliance', () => {
  const al1 = createAlignment(
    [
      { longitude: -76.96, latitude: -12.18 },
      { longitude: -76.958, latitude: -12.185 }
    ],
    'PE-1S',
    'Panamericana Sur',
    { shortName: 'PE-1S', color: '#2563EB', description: 'Corredor Sur' }
  );

  const al2 = createAlignment(
    [
      { longitude: -77.175, latitude: -11.78 },
      { longitude: -77.169, latitude: -11.765 }
    ],
    'PE-1N',
    'Panamericana Norte',
    { shortName: 'PE-1N', color: '#10B981' }
  );

  it('debe generar routes.txt con formato estándar', () => {
    const csv = generateGtfsRoutesTxt([al1, al2]);
    expect(csv).toContain('route_id,agency_id,route_short_name,route_long_name');
    expect(csv).toContain('PE-1S,MTC,"PE-1S","Panamericana Sur","Corredor Sur",3,2563EB,FFFFFF');
    expect(csv).toContain('PE-1N,MTC,"PE-1N","Panamericana Norte"');
  });

  it('debe generar shapes.txt con coordenadas y distancias acumuladas', () => {
    const csv = generateGtfsShapesTxt([al1, al2]);
    expect(csv).toContain('shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled');
    expect(csv).toContain('PE-1S,-12.180000,-76.960000,1,0.00');
    expect(csv).toContain('PE-1S,-12.185000,-76.958000,2,596.96');
    expect(csv).toContain('PE-1N,-11.780000,-77.175000,1,0.00');
  });

  it('debe generar trips.txt y agency.txt válidos', () => {
    const trips = generateGtfsTripsTxt([al1]);
    expect(trips).toContain('PE-1S,DAILY,TRIP-PE-1S-01,PE-1S,"Panamericana Sur",0');

    const agency = generateGtfsAgencyTxt();
    expect(agency).toContain('MTC,Ministerio de Transportes y Comunicaciones (Perú)');
  });
});
