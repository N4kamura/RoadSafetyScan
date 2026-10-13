# SPEC-05: Exportación e Interoperabilidad de Datos

- **ID:** SPEC-05
- **Módulo:** `pkg/export`
- **Estado:** `IMPLEMENTED` (Completado y verificado con pruebas unitarias)
- **Dependencias:** `SPEC-02` (Alineamiento vial), `SPEC-03` (Motor LRS)
- **Trazabilidad:** [Constitution - Module 5 & Principle 5](file:///d:/Projects/RoadSafetyScan/constitution.md#L74-L78)

---

## 1. Propósito y Alcance

Garantizar la interoperabilidad, apertura y transferibilidad de los resultados obtenidos en las auditorías de seguridad vial de **RoadSafetyScan**.

El módulo permite exportar de forma instantánea y local (client-side) los resultados del análisis en formatos abiertos y estándares del sector geoespacial y de transporte:
1. **Reporte Tabular CSV:** Perfil longitudinal discretizado por tramos métricos para análisis estadístico en hojas de cálculo (Excel, LibreOffice Calc, R, Python).
2. **Capa GeoJSON de Siniestros Referenciados:** Puntos geográficos enriquecidos con progresiva lineal ($S_i$), desviación lateral ($D_\perp$), lado de calzada y pertenencia al buffer.
3. **Capa GeoJSON de Tramos Segmentados del Eje:** Trazos de línea correspondientes a cada bin métrico con métricas consolidadas (EPDO, densidad, recuento) para visualización en Sistemas de Información Geográfica (QGIS, ArcGIS).

---

## 2. Esquemas de Exportación

### 2.1 Reporte Tabular CSV (`profile_report.csv`)

#### Estructura de Columnas
El archivo CSV se genera con cabeceras explícitas y codificación **UTF-8 con BOM** (`\uFEFF`) para compatibilidad directa con Microsoft Excel en configuraciones regionales hispanohablantes (Perú):

| Columna | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `bin_index` | Entero | Índice ordinal del segmento ($0, 1, \dots$) | `0` |
| `prog_inicio_m` | Decimal | Progresiva métrica inicial en metros | `0.00` |
| `prog_fin_m` | Decimal | Progresiva métrica final en metros | `100.00` |
| `estacion_inicio` | Texto | Formato MTC estación inicial | `km 0+000.00` |
| `estacion_fin` | Texto | Formato MTC estación final | `km 0+100.00` |
| `total_siniestros` | Entero | Conteo total de siniestros dentro de la faja | `5` |
| `siniestros_fatales` | Entero | Número de siniestros con fallecidos | `1` |
| `lesiones_graves` | Entero | Número de siniestros con heridos graves | `1` |
| `lesiones_leves` | Entero | Número de siniestros con heridos leves | `2` |
| `solo_danos` | Entero | Número de siniestros solo daños materiales | `1` |
| `indice_epdo` | Decimal | Severidad ponderada EPDO del tramo | `16.00` |
| `densidad_por_km` | Decimal | Tasa proyectada de siniestros por kilómetro | `50.00` |
| `tipo_predominante` | Texto | Tipo de siniestro más frecuente en el tramo | `CHOQUE` |

#### Ejemplo de Salida CSV
```csv
bin_index,prog_inicio_m,prog_fin_m,estacion_inicio,estacion_fin,total_siniestros,siniestros_fatales,lesiones_graves,lesiones_leves,solo_danos,indice_epdo,densidad_por_km,tipo_predominante
0,0.00,100.00,km 0+000.00,km 0+100.00,2,0,1,1,0,4.50,20.00,CHOQUE
1,100.00,200.00,km 0+100.00,km 0+200.00,5,1,1,2,1,16.00,50.00,ATROPELLO
2,200.00,300.00,km 0+200.00,km 0+300.00,0,0,0,0,0,0.00,0.00,NINGUNO
```

---

### 2.2 GeoJSON de Puntos Proyectados (`crashes_lrs.geojson`)

Genera un estándar `FeatureCollection` conforme a la especificación **RFC 7946** (WGS84):

```json
{
  "type": "FeatureCollection",
  "name": "RoadSafetyScan_ProjectedCrashes",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-77.0365, -12.0463]
      },
      "properties": {
        "crash_id": "CRASH-2024-001",
        "chainage_meters": 142.50,
        "station_formatted": "km 0+142.50",
        "lateral_distance_m": 8.35,
        "signed_lateral_distance_m": -8.35,
        "road_side": "LEFT",
        "is_inside_buffer": true,
        "severity": "FATAL",
        "crash_type": "CHOQUE",
        "timestamp": "2024-03-15T08:30:00Z",
        "projected_coordinates": [-77.0364, -12.0462]
      }
    }
  ]
}
```

---

### 2.3 GeoJSON de Segmentos Viales Homogéneos (`corridor_profile_bins.geojson`)

Permite a los usuarios cargar el perfil directamente en QGIS o ArcGIS para tematizar los tramos según el índice EPDO (mapa de calor o semaforización de tramos de concentración de accidentes):

```json
{
  "type": "FeatureCollection",
  "name": "RoadSafetyScan_CorridorSegments",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-77.0368, -12.0460],
          [-77.0360, -12.0468]
        ]
      },
      "properties": {
        "bin_index": 1,
        "station_start": "km 0+100.00",
        "station_end": "km 0+200.00",
        "total_crashes": 5,
        "fatal_count": 1,
        "grave_count": 1,
        "leve_count": 2,
        "danos_count": 1,
        "epdo_score": 16.00,
        "density_per_km": 50.00,
        "risk_level": "ALTO"
      }
    }
  ]
}
```

---

## 3. Mecanismos de Descarga en el Navegador (Client-Side)

Para asegurar que no se transfiera información a ningún servidor ni se requiera conexión a internet activa para descargar:
- Se utilizan URLs temporales en memoria creadas mediante la API nativa de JavaScript:
  `URL.createObjectURL(blob)`.
- El archivo se descarga automáticamente invocando un elemento `HTMLAnchorElement` virtual con el atributo `download`.
- Se liberan los recursos en memoria tras la descarga mediante `URL.revokeObjectURL(url)`.

```typescript
export interface ExportService {
  exportToCsv(results: LrsAnalysisResult, filename?: string): void;
  exportCrashesToGeoJson(results: LrsAnalysisResult, filename?: string): void;
  exportCorridorBinsToGeoJson(alignment: Alignment, results: LrsAnalysisResult, filename?: string): void;
}
```

---

## 4. Rendimiento y Criterios de Aceptación (DoD)

### 4.1 Presupuesto de Rendimiento
- Generación de CSV y GeoJSON para $50,000$ registros $\le 200\text{ ms}$.
- Consumo de memoria adicional durante la serialización $\le 50\text{ MB}$.

### 4.2 Casos de Prueba Sintéticos (Unit Tests)

#### Test Case 5.1: Integridad de Codificación CSV y Cabeceras
- **Given:** Un resultado LRS con 3 bins válidos.
- **When:** Se ejecuta `generateCsvString(lrsResult)`.
- **Then:**
  - El string resultante comienza con la marca BOM UTF-8 (`\uFEFF`).
  - La primera línea contiene exactamente las 13 cabeceras especificadas.
  - El número total de líneas es 4 (cabecera + 3 filas).

#### Test Case 5.2: Validez RFC 7946 en GeoJSON
- **Given:** Un resultado LRS con siniestros proyectados.
- **When:** Se serializa a GeoJSON con `generateProjectedCrashesGeoJson()`.
- **Then:**
  - El resultado es un JSON parseable con `type: "FeatureCollection"`.
  - Cada entidad tiene geometrías válidas de tipo `Point` con coordenadas numéricas en $[-180, 180]$ y $[-90, 90]$.
  - Los campos `chainage_meters` y `station_formatted` existen y son consistentes.
