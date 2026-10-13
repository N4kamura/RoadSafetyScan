/**
 * Generador de archivos en formato GTFS (routes.txt, shapes.txt, trips.txt, agency.txt)
 * Conforme a SPEC-05 y SPEC-15 (pkg/export)
 */

import { Alignment } from '../tracer/types.js';

export interface GtfsExportOptions {
  agencyId?: string;
  agencyName?: string;
  agencyUrl?: string;
  agencyTimezone?: string;
}

/**
 * Genera el contenido de routes.txt a partir de una o varias instancias de Alignment
 */
export function generateGtfsRoutesTxt(
  alignments: Alignment[],
  options?: GtfsExportOptions
): string {
  const agencyId = options?.agencyId || 'MTC';
  const lines: string[] = [
    'route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_color,route_text_color'
  ];

  for (const al of alignments) {
    const routeId = al.id;
    const shortName = al.shortName || al.id;
    const longName = al.name.replace(/"/g, '""');
    const desc = (al.description || `Corredor vial ${al.name}`).replace(/"/g, '""');
    const color = al.color ? al.color.replace(/^#/, '').toUpperCase() : '2563EB';
    const textColor = 'FFFFFF';
    const routeType = 3; // 3 = Autobús / Transporte por Carretera

    lines.push(
      `${routeId},${agencyId},"${shortName}","${longName}","${desc}",${routeType},${color},${textColor}`
    );
  }

  return lines.join('\n') + '\n';
}

/**
 * Genera el contenido de shapes.txt a partir de una o varias instancias de Alignment
 */
export function generateGtfsShapesTxt(alignments: Alignment[]): string {
  const lines: string[] = [
    'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled'
  ];

  for (const al of alignments) {
    const shapeId = al.id;
    for (let i = 0; i < al.vertices.length; i++) {
      const v = al.vertices[i];
      const seq = i + 1;
      const lat = v.coordinates.latitude.toFixed(6);
      const lon = v.coordinates.longitude.toFixed(6);
      const dist = v.cumulativeDistance.toFixed(2);
      lines.push(`${shapeId},${lat},${lon},${seq},${dist}`);
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Genera el contenido de trips.txt
 */
export function generateGtfsTripsTxt(alignments: Alignment[]): string {
  const lines: string[] = [
    'route_id,service_id,trip_id,shape_id,trip_headsign,direction_id'
  ];

  for (const al of alignments) {
    const routeId = al.id;
    const tripId = `TRIP-${routeId}-01`;
    const shapeId = al.id;
    const headsign = al.name.replace(/"/g, '""');
    lines.push(`${routeId},DAILY,${tripId},${shapeId},"${headsign}",0`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Genera el contenido de agency.txt
 */
export function generateGtfsAgencyTxt(options?: GtfsExportOptions): string {
  const agencyId = options?.agencyId || 'MTC';
  const agencyName = options?.agencyName || 'Ministerio de Transportes y Comunicaciones (Perú)';
  const agencyUrl = options?.agencyUrl || 'https://www.gob.pe/mtc';
  const agencyTimezone = options?.agencyTimezone || 'America/Lima';

  return (
    'agency_id,agency_name,agency_url,agency_timezone,agency_lang\n' +
    `${agencyId},${agencyName},${agencyUrl},${agencyTimezone},es\n`
  );
}
