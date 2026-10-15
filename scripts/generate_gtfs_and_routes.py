#!/usr/bin/env python3
"""
Script para generar archivos de rutas en formato GTFS (routes.txt, shapes.txt, trips.txt, agency.txt)
y en formato de texto (.txt) para los corredores existentes (PE-1S y PE-1N).
Conforme a SPEC-15.
"""

import math
import os
import json

EARTH_RADIUS_METERS = 6371008.8

def to_radians(degrees):
    return degrees * math.pi / 180.0

def haversine_distance(coord1, coord2):
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    if lon1 == lon2 and lat1 == lat2:
        return 0.0
    phi1 = to_radians(lat1)
    phi2 = to_radians(lat2)
    delta_phi = to_radians(lat2 - lat1)
    delta_lambda = to_radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return EARTH_RADIUS_METERS * c

def format_station(meters):
    km = int(meters // 1000)
    remainder = meters - (km * 1000)
    return f"km {km}+{remainder:06.2f}"

# Definición de ruta oficial de ejemplo (Panamericana)
ROUTES = [
    {
        "route_id": "EJEMPLO",
        "route_short_name": "EJEMPLO",
        "route_long_name": "Ruta de Ejemplo: Panamericana",
        "route_desc": "Trazo vial de ejemplo basado en el corredor Panamericana",
        "route_type": "3",  # 3 = Bus / Road Corridor
        "route_color": "2563EB",
        "route_text_color": "FFFFFF",
        "txt_filename": "ruta_ejemplo.txt",
        "coordinates": [
            [-76.976926, -12.217337],
            [-76.972565, -12.1934],
            [-76.973034, -12.190041],
            [-76.975464, -12.182705],
            [-76.982077, -12.16091],
            [-76.983571, -12.155341],
            [-76.983861, -12.151644],
            [-76.982531, -12.147232],
            [-76.981459, -12.142202],
            [-76.980364, -12.137228],
            [-76.978941, -12.133567],
            [-76.977193, -12.128358],
            [-76.976959, -12.124784],
            [-76.977454, -12.116034],
            [-76.978783, -12.106113],
            [-76.980011, -12.097034],
            [-76.981106, -12.088132],
            [-76.98215, -12.086014],
            [-76.982202, -12.085325],
            [-76.981915, -12.084407],
            [-76.978681, -12.081604],
            [-76.97675, -12.079487],
            [-76.975393, -12.076706],
            [-76.972158, -12.068772],
            [-76.971349, -12.065813],
            [-76.971427, -12.063288],
            [-76.972028, -12.06145],
            [-76.973723, -12.057751],
            [-76.975628, -12.052946],
            [-76.97688, -12.05116],
            [-76.97868, -12.0494],
            [-76.985515, -12.04348],
            [-76.986702, -12.042273],
            [-76.987885, -12.040244],
            [-76.98876, -12.036823],
            [-76.989691, -12.034571],
            [-76.990894, -12.032584],
            [-76.992977, -12.030844],
            [-76.994992, -12.029668],
            [-76.996212, -12.029122],
            [-76.998075, -12.029055],
            [-77.002071, -12.030682],
            [-77.005289, -12.031908],
            [-77.008203, -12.033548],
            [-77.013094, -12.037441]
        ]
    }
]


def generate_files(target_dir):
    os.makedirs(target_dir, exist_ok=True)
    
    # 1. agency.txt
    agency_txt = (
        "agency_id,agency_name,agency_url,agency_timezone,agency_lang\n"
        "MTC,Ministerio de Transportes y Comunicaciones (Perú),https://www.gob.pe/mtc,America/Lima,es\n"
    )
    with open(os.path.join(target_dir, "agency.txt"), "w", encoding="utf-8") as f:
        f.write(agency_txt)
        
    # 2. routes.txt
    routes_rows = ["route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_color,route_text_color"]
    for r in ROUTES:
        routes_rows.append(
            f"{r['route_id']},MTC,\"{r['route_short_name']}\",\"{r['route_long_name']}\",\"{r['route_desc']}\",{r['route_type']},{r['route_color']},{r['route_text_color']}"
        )
    with open(os.path.join(target_dir, "routes.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(routes_rows) + "\n")
        
    # 3. shapes.txt
    shapes_rows = ["shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled"]
    for r in ROUTES:
        shape_id = r["route_id"]
        coords = r["coordinates"]
        cum_dist = 0.0
        for i, pt in enumerate(coords):
            if i > 0:
                cum_dist += haversine_distance(coords[i - 1], pt)
            seq = i + 1
            shapes_rows.append(f"{shape_id},{pt[1]:.6f},{pt[0]:.6f},{seq},{cum_dist:.2f}")
            
    with open(os.path.join(target_dir, "shapes.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(shapes_rows) + "\n")

    # 4. trips.txt
    trips_rows = ["route_id,service_id,trip_id,shape_id,trip_headsign,direction_id"]
    for r in ROUTES:
        trips_rows.append(f"{r['route_id']},DAILY,TRIP-{r['route_id']}-01,{r['route_id']},\"{r['route_long_name']}\",0")
    with open(os.path.join(target_dir, "trips.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(trips_rows) + "\n")

    # Limpiar archivos obsoletos previos si existen
    for old_file in ["PE-1S.txt", "PE-1N.txt", "panamericana.txt"]:
        old_path = os.path.join(target_dir, old_file)
        if os.path.exists(old_path):
            os.remove(old_path)

    # 5. Archivos individuales .txt
    for r in ROUTES:
        txt_rows = [
            f"# RoadSafetyScan - Trazo de Alineamiento Vial: {r['route_id']}",
            f"# Nombre: {r['route_long_name']}",
            "index,longitude,latitude,cumulative_meters,station"
        ]
        coords = r["coordinates"]
        cum_dist = 0.0
        for i, pt in enumerate(coords):
            if i > 0:
                cum_dist += haversine_distance(coords[i - 1], pt)
            station = format_station(cum_dist)
            txt_rows.append(f"{i},{pt[0]:.6f},{pt[1]:.6f},{cum_dist:.2f},{station}")
        
        filename = r.get("txt_filename", f"{r['route_id']}.txt")
        file_path = os.path.join(target_dir, filename)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write("\n".join(txt_rows) + "\n")
            
    # 6. manifest.json (para consumo dinámico en la web)
    manifest = []
    for r in ROUTES:
        coords = r["coordinates"]
        cum_dist = 0.0
        for i in range(1, len(coords)):
            cum_dist += haversine_distance(coords[i - 1], coords[i])
        filename = r.get("txt_filename", f"{r['route_id']}.txt")
        manifest.append({
            "id": r["route_id"],
            "name": r["route_long_name"],
            "shortName": r["route_short_name"],
            "description": r["route_desc"],
            "color": f"#{r['route_color']}",
            "totalLengthMeters": round(cum_dist, 2),
            "vertexCount": len(coords),
            "txtFile": filename,
            "coordinates": coords
        })
    with open(os.path.join(target_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"[OK] Archivos generados correctamente en: {target_dir}")

if __name__ == "__main__":
    generate_files("routes")
    generate_files(os.path.join("public", "routes"))
