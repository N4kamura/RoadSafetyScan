# Tareas: SPEC-05 — Exportación e Interoperabilidad (`pkg/export`)

- **Especificación:** [`specs/05-export-interoperability.md`](file:///d:/Projects/RoadSafetyScan/specs/05-export-interoperability.md)
- **Módulo:** `pkg/export`
- **Estado:** `IMPLEMENTED` (100% de tests unitarios pasando)
- **Dependencias:** [`pkg/tracer`](file:///d:/Projects/RoadSafetyScan/src/pkg/tracer/index.ts), [`pkg/lrs`](file:///d:/Projects/RoadSafetyScan/src/pkg/lrs/index.ts)

---

## Desglose Detallado de Tareas

### Grupo 1: Generador de Reporte Tabular CSV
- [x] `TASK-5.1.1`: Implementar `generateCsvProfileReport(results: LrsAnalysisResult): string` en `src/pkg/export/csv.ts`:
  - Inserción de cabecera UTF-8 BOM (`\uFEFF`) para compatibilidad directa con Microsoft Excel en español (Perú).
  - Generación de las 13 columnas estandarizadas: `bin_index`, `prog_inicio_m`, `prog_fin_m`, `estacion_inicio`, `estacion_fin`, `total_siniestros`, `siniestros_fatales`, `lesiones_graves`, `lesiones_leves`, `solo_danos`, `indice_epdo`, `densidad_por_km`, `tipo_predominante`.
- [x] `TASK-5.1.2`: Crear tests unitarios en `tests/unit/export/csv.test.ts` (Caso 5.1 del spec).

### Grupo 2: Generador GeoJSON de Siniestros Proyectados
- [x] `TASK-5.2.1`: Implementar `generateProjectedCrashesGeoJson(results: LrsAnalysisResult): GeoJsonObject` en `src/pkg/export/geojson.ts`:
  - FeatureCollection con entidades de tipo `Point`.
  - Propiedades enriquecidas con atributos LRS: `crash_id`, `chainage_meters`, `station_formatted`, `lateral_distance_m`, `signed_lateral_distance_m`, `road_side`, `is_inside_buffer`, severidad, tipología, fecha.
- [x] `TASK-5.2.2`: Crear tests unitarios en `tests/unit/export/geojson.test.ts` (Caso 5.2 del spec).

### Grupo 3: Generador GeoJSON de Tramos del Corredor Segmentado
- [x] `TASK-5.3.1`: Implementar `generateCorridorBinsGeoJson(alignment: Alignment, results: LrsAnalysisResult): GeoJsonObject` en `src/pkg/export/geojson.ts`:
  - Sub-segmentación del eje lineal por cada bin $[S_{\text{start}}, S_{\text{end}}]$.
  - Asignación de propiedades consolidadas por tramo (EPDO, siniestros totales, desgloses, nivel de riesgo).
- [x] `TASK-5.3.2`: Validar con el resultado del análisis LRS sobre el dataset simulado.

### Grupo 4: Servicio de Descarga Local (Browser Client-Side)
- [x] `TASK-5.4.1`: Implementar `triggerBrowserDownload(content: string, filename: string, mimeType: string): void` en `src/pkg/export/download.ts`.
- [x] `TASK-5.4.2`: Barrel export en `src/pkg/export/index.ts`.

---

## Criterios de Aceptación (DoD del Spec)
- [x] 100% de tests unitarios de serialización pasando (3 tests específicos verificados).
- [x] Cumplimiento estricto del estándar GeoJSON RFC 7946.
- [x] Archivos CSV legibles sin alteración de caracteres en Excel Windows con UTF-8 BOM.
