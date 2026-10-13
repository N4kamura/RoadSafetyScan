# Tareas: SPEC-02 — Trazo Geométrico y Alineamiento (`pkg/tracer`)

- **Especificación:** [`specs/02-geometric-trace-alignment.md`](file:///d:/Projects/RoadSafetyScan/specs/02-geometric-trace-alignment.md)
- **Módulo:** `pkg/tracer`
- **Estado:** `IMPLEMENTED` (100% de tests unitarios pasando)

---

## Desglose Detallado de Tareas

### Grupo 1: Infraestructura y Tipos Base
- [x] `TASK-2.1.1`: Configurar `package.json`, TypeScript (`tsconfig.json`) y framework de testing (`vitest`).
- [x] `TASK-2.1.2`: Definir tipos geodésicos y de alineamiento en `src/pkg/tracer/types.ts`:
  - `GeoCoordinate`
  - `AlignmentVertex`
  - `AlignmentSegment`
  - `Alignment`
  - `BoundingBox`
  - `AlignmentWarning`

### Grupo 2: Algoritmos Geodésicos & Progresivas (TDD)
- [x] `TASK-2.2.1`: Implementar cálculo de distancia geodésica Haversine / WGS84 en metros en `src/pkg/tracer/geodesy.ts`.
- [x] `TASK-2.2.2`: Implementar cálculo de azimut geodésico inicial en grados $[0, 360)$ en `src/pkg/tracer/geodesy.ts`.
- [x] `TASK-2.2.3`: Implementar formateador oficial de progresiva vial peruana (MTC DG-2018):
  - Formato: `km K + PPP.PP` (ej. `km 0+000.00`, `km 14+350.25`).
- [x] `TASK-2.2.4`: Escribir suite de pruebas unitarias `tests/unit/tracer/geodesy.test.ts` cubriendo:
  - Distancia entre dos puntos con coordenadas conocidas en Perú.
  - Azimut en las 4 direcciones cardinales e intercardinales.
  - Casos de borde de formateo de estación ($0\text{ m}$, $999.99\text{ m}$, $1000.00\text{ m}$, $15420.50\text{ m}$).

### Grupo 3: Construcción y Validación de Alineamiento
- [x] `TASK-2.3.1`: Implementar `createAlignment` en `src/pkg/tracer/alignment.ts`:
  - Deduplicación automática de vértices consecutivos con distancia $< 0.10\text{ m}$.
  - Lanzar error si la polilínea contiene menos de 2 vértices válidos.
  - Cálculo de distancias acumuladas $C_k$ para cada vértice.
  - Construcción de segmentos con sus respectivos bounding boxes.
  - Cálculo de la longitud total y del bounding box global del alineamiento.
- [x] `TASK-2.3.2`: Implementar validador geométrico de auto-intersecciones y advertencia de ángulos de deflexión agudos ($> 150^\circ$).
- [x] `TASK-2.3.3`: Escribir suite de pruebas unitarias `tests/unit/tracer/alignment.test.ts` cubriendo:
  - Alineamiento simple de 2 vértices.
  - Fusión de vértices degenerados idénticos o sub-decimétricos.
  - Detección de auto-intersección.
  - Cálculo correcto del Bounding Box.

### Grupo 4: Importador GeoJSON
- [x] `TASK-2.4.1`: Implementar `parseGeoJsonAlignment` en `src/pkg/tracer/importers/geojson.ts` para extraer `LineString` y generar un objeto `Alignment`.
- [x] `TASK-2.4.2`: Probar la importación con el archivo mock real generado: `mock/alignment.geojson`.
- [x] `TASK-2.4.3`: Escribir prueba unitaria `tests/unit/tracer/geojson-importer.test.ts`.

---

## Criterios de Aceptación (DoD del Spec)
- [x] 100% de los tests unitarios en `tests/unit/tracer/` pasando (20 tests verificados).
- [x] Cobertura completa de tipos TypeScript con verificación estricta (`tsc --noEmit`).
- [x] Sin dependencias en librerías externas pesadas no autorizadas.
