# Tareas: SPEC-07 — Diagnóstico, Estabilidad de Renderizado y Visualización Cartográfica del Corredor y Perfil

- **Especificación:** [`specs/07-map-layer-rendering-diagnostics.md`](file:///d:/Projects/RoadSafetyScan/specs/07-map-layer-rendering-diagnostics.md)
- **Módulo:** `pkg/viz` & `ui/map-view`
- **Estado:** `COMPLETED`

---

## Desglose Detallado de Tareas

### Grupo 1: Corrección de Fuentes GeoJSON, Workers y Estilos de Capas
- [x] `TASK-7.1.1`: Auditar y corregir `src/pkg/viz/maplibre-adapter.ts`:
  - Usar `FeatureCollection` con `features: []` en `source-highlight` cuando no hay tramo activo.
- [x] `TASK-7.1.2`: Mejorar la visibilidad de la línea del eje vial:
  - Crear capa de casing/halo oscuro (`layer-alignment-casing`) de 8px en `#0F172A`.
  - Crear capa de trazo central (`layer-alignment-line`) de 4.5px en `#0284C7`.
- [x] `TASK-7.1.3`: Mejorar la nitidez y visibilidad de los puntos de accidentes (`layer-crashes-points`):
  - Círculos de radio 7px con borde blanco de 2px.
  - Expresión de color MTC nítida (Fatal `#DC2626`, Graves `#EA580C`, Leves `#FACC15`, Daños `#2563EB`).
- [x] `TASK-7.1.4`: Configurar explícitamente el Web Worker de MapLibre GL JS v6 para Vite:
  - Importar worker URL mediante `maplibre-gl-worker.mjs?worker&url`.
  - Invocar `maplibregl.setWorkerUrl()` antes del montaje del mapa para resolver el fallo de carga del worker.

### Grupo 2: Ciclo de Vida Resiliente, Selector de Trazados y Encuadre
- [x] `TASK-7.2.1`: Refactorizar `MapViewController` en `src/ui/map-view.ts`:
  - Implementar inicialización idempotente de capas.
  - Escuchar eventos `load` y `style.load`, además de verificar síncronamente `map.isStyleLoaded()`.
- [x] `TASK-7.2.2`: Forzar `map.resize()` y encuadre `fitToAlignment()` con envolvente conjunta (eje vial + perfil curvilíneo).
- [x] `TASK-7.2.3`: Agregar captura de errores con logging de diagnóstico en `MapViewController`.
- [x] `TASK-7.2.4`: Implementar Selector de Trazados (`PE-1S`, `PE-1N`, `CUSTOM`) y botón de acción `⚡ Calcular Auditoría Vial (LRS)`.
- [x] `TASK-7.2.5`: Reposicionar la leyenda cartográfica al cuadrante inferior izquierdo para despejar el corredor visual.

### Grupo 3: Verificación con Pruebas, Compilación y Diagnóstico Headless
- [x] `TASK-7.3.1`: Crear suite de pruebas unitarias en `tests/unit/viz/maplibre-render.test.ts`.
- [x] `TASK-7.3.2`: Ejecutar `npx vitest run` para verificar el 100% de la suite de pruebas (42 tests pasando).
- [x] `TASK-7.3.3`: Ejecutar `npx vite build` para confirmar el paquete de producción limpio con chunk de worker independiente.
- [x] `TASK-7.3.4`: Verificación e inspección automatizada en navegador headless (CDP) con captura visual de pantalla libre de errores.
