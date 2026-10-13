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

# Definición de ruta de ejemplo (Panamericana Sur Km 18 al 25)
ROUTES = [
    {
        "route_id": "EJEMPLO",
        "route_short_name": "EJEMPLO",
        "route_long_name": "Ruta de Ejemplo - Panamericana Sur (Km 18 al 25)",
        "route_desc": "Trazo de alineamiento vial de ejemplo (Km 18 al 25)",
        "route_type": "3",  # 3 = Bus / Road Corridor
        "route_color": "2563EB",
        "route_text_color": "FFFFFF",
        "txt_filename": "ruta_ejemplo.txt",
        "coordinates": [
            [-76.960, -12.180],
            [-76.958, -12.185],
            [-76.955, -12.192],
            [-76.951, -12.200],
            [-76.948, -12.206],
            [-76.944, -12.213],
            [-76.940, -12.221],
            [-76.937, -12.228],
            [-76.933, -12.235],
            [-76.930, -12.242]
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
    for old_file in ["PE-1S.txt", "PE-1N.txt"]:
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
