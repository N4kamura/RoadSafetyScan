# Tareas: SPEC-03 — Motor de Referenciación Lineal (LRS) y Agregación (`pkg/lrs`)

- **Especificación:** [`specs/03-lrs-projection-engine.md`](file:///d:/Projects/RoadSafetyScan/specs/03-lrs-projection-engine.md)
- **Módulo:** `pkg/lrs`
- **Estado:** `IMPLEMENTED` (100% de tests unitarios e integración pasando)
- **Dependencias:** [`pkg/tracer`](file:///d:/Projects/RoadSafetyScan/src/pkg/tracer/index.ts) (Implementado y verificado)

---

## Desglose Detallado de Tareas

### Grupo 1: Tipos y Modelos de Dominio LRS
- [x] `TASK-3.1.1`: Definir enums y estructuras en `src/pkg/lrs/types.ts`:
  - `RoadSide`: `'LEFT' | 'RIGHT' | 'CENTER'`
  - `ProjectedCrash`: Punto proyectado con $S_i$, $D_\perp$, progresiva formateada, lado de calzada y bandera `isInsideBuffer`.
  - `LrsBinAggregate`: Métrica agregada por intervalo $\Delta S$ (conteos por severidad, tipología y score EPDO).
  - `LrsEngineOptions`: Configuración de buffer ($W_{\text{buffer}}$), bin size ($\Delta S$) y ponderaciones EPDO.
  - `LrsAnalysisResult`: Resultado consolidado de análisis.

### Grupo 2: Motor Matemático de Proyección Ortogonal (TDD)
- [x] `TASK-3.2.1`: Implementar proyección en plano cartesiano local métrico en `src/pkg/lrs/projection.ts`:
  - Conversión a espacio métrico relativo al vértice inicial del segmento.
  - Cálculo del parámetro escalar $t = (\vec{v} \cdot \vec{u}) / \|\vec{u}\|^2$ y fijación $t^* = \max(0, \min(1, t))$.
  - Interpolación de la coordenada proyectada $P'$ en WGS84.
  - Distancia ortogonal absoluta $D_\perp = \|\vec{v} - \vec{P'}\|$.
  - Desviación ortogonal firmada y detección de lado de calzada (producto vectorial 2D / determinante).
- [x] `TASK-3.2.2`: Implementar algoritmo de desempate y selección de segmento en `src/pkg/lrs/projection.ts`:
  - Minimización de $|D_\perp|$.
  - Preferencia por proyección perpendicular interna ($0 < t^* < 1$) frente a extremos.
  - Desempate aguas arriba (menor índice de segmento).
- [x] `TASK-3.2.3`: Escribir suite de pruebas unitarias `tests/unit/lrs/projection.test.ts` cubriendo:
  - Casos 3.1 y 3.2 de SPEC-03 (punto exacto sobre eje, puntos a izquierda y derecha).
  - Puntos en vértices con giros.

### Grupo 3: Filtrado de Buffer Paramétrico y Agregación en Bins
- [x] `TASK-3.3.1`: Implementar filtro de buffer ($|D_\perp| \le W_{\text{buffer}}$) y recorte longitudinal en `src/pkg/lrs/aggregator.ts`.
- [x] `TASK-3.3.2`: Implementar particionado en intervalos métricos regulares ($\Delta S$) y cálculo del índice ponderado EPDO según directivas MTC de Perú.
- [x] `TASK-3.3.3`: Implementar función orquestadora `analyzeLrs(alignment, crashes, options): LrsAnalysisResult`.
- [x] `TASK-3.3.4`: Escribir suite de pruebas unitarias `tests/unit/lrs/aggregator.test.ts` (Casos 3.3 y 3.4 del spec).

### Grupo 4: Prueba de Integración con Datos Sintéticos
- [x] `TASK-3.4.1`: Crear prueba de integración en `tests/integration/lrs-mock-corridor.test.ts` ejecutando el motor LRS completo sobre `mock/alignment.geojson` y los 75 siniestros de `mock/crashes.json`.
- [x] `TASK-3.4.2`: Verificar tiempos de ejecución ($\le 45\text{ ms}$) y consistencia de los hotspots identificados.

---

## Criterios de Aceptación (DoD del Spec)
- [x] 100% de pruebas unitarias e integración en `tests/` pasando (29 tests totales en la suite).
- [x] Precisión métrica comprobada: $|D_\perp| \le 0.05\text{ m}$ para puntos exactos sobre el eje.
- [x] Tiempo de ejecución verificado: $\sim 13\text{ ms}$ (muy inferior al límite máximo de $45\text{ ms}$).
