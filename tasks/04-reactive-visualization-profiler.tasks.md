# Tareas: SPEC-04 — Perfilador Longitudinal Reactivo & VisQuill (`pkg/viz`)

- **Especificación:** [`specs/04-reactive-visualization-profiler.md`](file:///d:/Projects/RoadSafetyScan/specs/04-reactive-visualization-profiler.md)
- **Módulo:** `pkg/viz`
- **Estado:** `IMPLEMENTED` (100% de tests unitarios pasando)
- **Dependencias:** [`pkg/tracer`](file:///d:/Projects/RoadSafetyScan/src/pkg/tracer/index.ts), [`pkg/lrs`](file:///d:/Projects/RoadSafetyScan/src/pkg/lrs/index.ts)

---

## Desglose Detallado de Tareas

### Grupo 1: Estado Reactivo y Bus de Eventos Bidireccional
- [x] `TASK-4.1.1`: Definir tipos del estado visualizador en `src/pkg/viz/types.ts`:
  - `FilterState` (severidades activas, tipos activos, rango de años).
  - `SelectionState` (bin seleccionado/hover, siniestro seleccionado/hover, tramo resaltado).
  - `VizStoreState` (alignment, crashes, config, lrsResults, selection).
  - Eventos de interacción (`VizEvent`).
- [x] `TASK-4.1.2`: Implementar el store reactivo `VizStore` (Observer / Event Emitter) en `src/pkg/viz/store.ts`:
  - Despacho y suscripción a eventos en $< 16\text{ ms}$ (60 FPS).
  - Recálculo reactivo de `lrsResults` al cambiar filtros, buffer o bin size.
  - Sincronización del estado de resalte (hover bin $\leftrightarrow$ resalte mapa, hover crash $\leftrightarrow$ crosshair perfil).

### Grupo 2: Adaptador para VisQuill GDK
- [x] `TASK-4.2.1`: Implementar generador de configuración y dataset para VisQuill GDK en `src/pkg/viz/visquill-adapter.ts`:
  - Formateo del eje horizontal $X$ (progresiva en km con ticks formateados `km K+PPP`).
  - Formateo del eje vertical $Y$ según modo métrico (`COUNT`, `EPDO`, `DENSITY_KM`).
  - Paleta estandarizada MTC (rojo fatal `#DC2626`, naranja grave `#EA580C`, etc.).
  - Generación del string obligatorio de atribución de licencia de VisQuill GDK para proyectos open-source.

### Grupo 3: Adaptador para MapLibre GL JS
- [x] `TASK-4.3.1`: Implementar generador de fuentes y capas de MapLibre en `src/pkg/viz/maplibre-adapter.ts`:
  - Capa de línea del eje vial (con símbolos direccionales).
  - Capa de polígono de buffer translúcido.
  - Capa de marcadores de siniestros (círculos coloreados por severidad y filtrados).
  - Capa de resalte activo para el tramo $[S_{\text{start}}, S_{\text{end}}]$.

### Grupo 4: Tests Unitarios y de Integración Reactiva
- [x] `TASK-4.4.1`: Crear tests unitarios en `tests/unit/viz/store.test.ts` verificando:
  - Casos 4.1 y 4.2 del spec: evento `hoverBin` emite rango de resaltado para mapa.
  - Evento `setFilters` filtra siniestros y re-computa el resultado LRS.
  - Atribución de VisQuill GDK presente en la configuración.
- [x] `TASK-4.4.2`: Barrel export en `src/pkg/viz/index.ts`.

---

## Criterios de Aceptación (DoD del Spec)
- [x] 100% de tests unitarios del módulo `pkg/viz` pasando (4 tests específicos verificados).
- [x] Latencia del bus de eventos inferior a 16 ms (60 FPS).
- [x] Atribución legal de VisQuill GDK explícitamente incorporada.
