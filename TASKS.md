# Plan de Tareas del Proyecto (TASKS.md) - RoadSafetyScan

Este documento gestiona la ejecución técnica del proyecto bajo **Spec-Driven Development (SDD)**. Cada tarea está vinculada a una especificación técnica formal y a criterios de aceptación verificables mediante tests.

---

## Estado Global del Proyecto

| Hito / Módulo | Especificación | Estado | Progreso |
| :--- | :--- | :--- | :--- |
| **Fase 0: Datos Sintéticos (Mock)** | [`specs/01-data-ingestion-indexing.md`](file:///d:/Projects/RoadSafetyScan/specs/01-data-ingestion-indexing.md) | `COMPLETADO` | 100% (Dataset simulado generado) |
| **Fase 1: Trazo & Alineamiento** | [`specs/02-geometric-trace-alignment.md`](file:///d:/Projects/RoadSafetyScan/specs/02-geometric-trace-alignment.md) | `COMPLETADO (IMPLEMENTED)` | 100% (20 tests unitarios pasando) |
| **Fase 2: Motor LRS & Agregación** | [`specs/03-lrs-projection-engine.md`](file:///d:/Projects/RoadSafetyScan/specs/03-lrs-projection-engine.md) | `COMPLETADO (IMPLEMENTED)` | 100% (9 tests unitarios e integración) |
| **Fase 3: Exportación CSV/GeoJSON** | [`specs/05-export-interoperability.md`](file:///d:/Projects/RoadSafetyScan/specs/05-export-interoperability.md) | `COMPLETADO (IMPLEMENTED)` | 100% (3 tests de serialización) |
| **Fase 4: Visualización Cartesiana**| [`specs/04-reactive-visualization-profiler.md`](file:///d:/Projects/RoadSafetyScan/specs/04-reactive-visualization-profiler.md) | `SUPERSEDED` por Fase 5 | 100% |
| **Fase 5: Perfil Curvilíneo en Mapa** | [`specs/06-curvilinear-profile-along-line.md`](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md) | `COMPLETADO (IMPLEMENTED)` | 100% (Profiles along a line - VisQuill A1) |
| **Fase 6: Diagnóstico & Render Cartográfico** | [`specs/07-map-layer-rendering-diagnostics.md`](file:///d:/Projects/RoadSafetyScan/specs/07-map-layer-rendering-diagnostics.md) | `COMPLETADO (IMPLEMENTED)` | 100% (Renderizado de trazo, puntos y perfil) |
| **Fase 7: Puntos según Zoom (SPEC-08)** | [`specs/08-crash-points-zoom-visibility.md`](file:///d:/Projects/RoadSafetyScan/specs/08-crash-points-zoom-visibility.md) | `COMPLETADO (IMPLEMENTED)` | 100% (minzoom 13.5 en puntos de accidentes) |
| **Fase 8: Auto-Escalado y Límites de Zoom (SPEC-09)** | [`specs/09-zoom-limits-and-autoscale.md`](file:///d:/Projects/RoadSafetyScan/specs/09-zoom-limits-and-autoscale.md) | `COMPLETADO (IMPLEMENTED)` | 100% (minZoom 10.5 y escala adaptativa) |
| **Fase 9: Reloj Dinámico Circular (SPEC-10)** | [`specs/10-circular-time-range-clock.md`](file:///d:/Projects/RoadSafetyScan/specs/10-circular-time-range-clock.md) | `COMPLETADO (IMPLEMENTED)` | 100% (Reloj circular dinámico y filtro temporal) |
| **Fase 10: Puntero y Línea Conectora (SPEC-11)** | [`specs/11-interactive-chainage-pointer.md`](file:///d:/Projects/RoadSafetyScan/specs/11-interactive-chainage-pointer.md) | `COMPLETADO (IMPLEMENTED)` | 100% (Botón semicircular y línea al trazo) |
| **Fase 11: Handle de Escala Transversal (SPEC-12)** | [`specs/12-interactive-scale-handle.md`](file:///d:/Projects/RoadSafetyScan/specs/12-interactive-scale-handle.md) | `COMPLETADO (IMPLEMENTED)` | 100% |
| **Fase 12: Filtro Temporal por Años (SPEC-13)** | [`specs/13-annual-temporal-filter.md`](file:///d:/Projects/RoadSafetyScan/specs/13-annual-temporal-filter.md) | `COMPLETADO (IMPLEMENTED)` | 100% |
| **Fase 13: BBDD ONSV, Vehículos y Personas (SPEC-14)** | [`specs/14-database-integration-and-severity-profiling.md`](file:///d:/Projects/RoadSafetyScan/specs/14-database-integration-and-severity-profiling.md) | `COMPLETADO (IMPLEMENTED)` | 100% |

---

## Fase 0: Conjunto de Datos Sintéticos (Stand-by de SPEC-01)
- [x] **TASK-0.1:** Crear trazado de referencia simulado (`mock/alignment.json` y `mock/alignment.geojson`) de ~7.6 km en la Panamericana Sur (PE-1S) con vértices y progresivas precalculadas.
- [x] **TASK-0.2:** Generar base de datos ficticia de 75 siniestros viales (`mock/crashes.json` y `mock/crashes.geojson`) con severidades (MTC), tipologías, fechas y distancias laterales respecto al eje.
- [x] **TASK-0.3:** Establecer `SPEC-01` en estado `STANDBY` en la documentación del repositorio.

---

## Fase 1: SPEC-02 — Trazo Geométrico & Alineamiento (`pkg/tracer`) [COMPLETADO]
- [x] **TASK-2.1.1:** Inicializar entorno TypeScript y configuración de testing con `Vitest` en el proyecto.
- [x] **TASK-2.1.2:** Crear estructura de carpetas de código fuente `src/pkg/tracer/` y de pruebas `tests/unit/tracer/`.
- [x] **TASK-2.2.1:** Definir interfaces TypeScript de `GeoCoordinate`, `AlignmentVertex`, `AlignmentSegment`, `Alignment` y `BoundingBox`.
- [x] **TASK-2.2.2:** Implementar cálculo de distancia geodésica de Haversine / WGS84 entre dos coordenadas en `src/pkg/tracer/geodesy.ts`.
- [x] **TASK-2.2.3:** Implementar cálculo de Azimut geodésico inicial $[0^\circ, 360^\circ)$ entre vértices consecutivos.
- [x] **TASK-2.2.4:** Implementar formateador de estación vial según normativa MTC DG-2018 (`formatStation(meters)` $\rightarrow$ `"km K+PPP.PP"`).
- [x] **TASK-2.2.5:** Crear tests unitarios en `tests/unit/tracer/geodesy.test.ts` (9 tests verificados).
- [x] **TASK-2.3.1:** Implementar validador y sanitizador de vértices (deduplicación $< 0.10\text{ m}$ y mínimo 2 vértices).
- [x] **TASK-2.3.2:** Implementar la función `createAlignment` con distancias acumuladas $C_k$ y bounding boxes individuales y globales.
- [x] **TASK-2.3.3:** Implementar detección de auto-intersección de segmentos y advertencia de ángulos de deflexión agudos ($> 150^\circ$).
- [x] **TASK-2.3.4:** Crear tests unitarios en `tests/unit/tracer/alignment.test.ts` (6 tests verificados).
- [x] **TASK-2.4.1:** Implementar parser de GeoJSON LineString en `src/pkg/tracer/importers/geojson.ts`.
- [x] **TASK-2.4.2:** Validar importación utilizando el archivo simulado `mock/alignment.geojson`.
- [x] **TASK-2.4.3:** Crear tests unitarios de integración en `tests/unit/tracer/geojson-importer.test.ts` (5 tests verificados).

---

## Fase 2: SPEC-03 — Motor LRS y Agregación (`pkg/lrs`) [COMPLETADO]
- [x] **TASK-3.1.1:** Definir modelos de datos TypeScript para LRS (`ProjectedCrash`, `LrsBinAggregate`, `LrsAnalysisResult`, `LrsEngineOptions`).
- [x] **TASK-3.2.1:** Implementar proyección ortogonal local cartesiana métrica ($t^*$ y distancia ortogonal firmada $D_\perp$ para margen izquierda/derecha).
- [x] **TASK-3.2.2:** Implementar algoritmo de desempate en curvas y vértices agudos (minimización de distancia y preferencia de proyección perpendicular interna).
- [x] **TASK-3.2.3:** Crear suite de tests unitarios geométricos en `tests/unit/lrs/projection.test.ts` (4 tests verificados).
- [x] **TASK-3.3.1:** Implementar filtro de buffer paramétrico ($W_{\text{buffer}}$) con retención de siniestros fuera de faja para auditoría.
- [x] **TASK-3.3.2:** Implementar algoritmo de segmentación homogénea por bins ($\Delta S$) y cálculo de severidad ponderada EPDO (normativa MTC).
- [x] **TASK-3.3.3:** Implementar función orquestadora `analyzeLrs()`.
- [x] **TASK-3.3.4:** Crear tests unitarios en `tests/unit/lrs/aggregator.test.ts` (4 tests verificados).
- [x] **TASK-3.4.1:** Crear prueba de integración en `tests/integration/lrs-mock-corridor.test.ts` con `mock/alignment.geojson` y `mock/crashes.json`.
- [x] **TASK-3.4.2:** Verificar tiempo de ejecución en procesador ($\sim 9\text{ ms} \le 45\text{ ms}$).

---

## Fase 3: SPEC-05 — Exportación e Interoperabilidad (`pkg/export`) [COMPLETADO]
- [x] **TASK-5.1.1:** Implementar generador de reporte tabular CSV con UTF-8 BOM (`\uFEFF`) y 13 columnas estandarizadas.
- [x] **TASK-5.1.2:** Crear tests unitarios en `tests/unit/export/csv.test.ts` (1 test verificado).
- [x] **TASK-5.2.1:** Implementar generador de GeoJSON para siniestros referenciados ($S_i$, $D_\perp$, estación).
- [x] **TASK-5.2.2:** Crear tests unitarios en `tests/unit/export/geojson.test.ts` (2 tests verificados).
- [x] **TASK-5.3.1:** Implementar generador de GeoJSON para tramos del corredor segmentado por bins métricos con indicador de riesgo.
- [x] **TASK-5.4.1:** Implementar servicio de descarga local en navegador (`Blob` / `URL.createObjectURL`).
- [x] **TASK-5.4.2:** Barrel export en `src/pkg/export/index.ts`.

---

## Fase 4: SPEC-04 — Perfilador Reactivo & VisQuill (`pkg/viz`) [COMPLETADO]
- [x] **TASK-4.1.1:** Definir tipos del estado visualizador en `src/pkg/viz/types.ts`.
- [x] **TASK-4.1.2:** Implementar el store reactivo `VizStore` (Observer / Event Emitter) con latencia $< 16\text{ ms}$.
- [x] **TASK-4.2.1:** Implementar adaptador para VisQuill GDK con paleta MTC y atribución legal obligatoria.
- [x] **TASK-4.3.1:** Implementar adaptador de fuentes y capas para MapLibre GL JS.
- [x] **TASK-4.4.1:** Crear tests unitarios en `tests/unit/viz/store.test.ts` (4 tests verificados).
- [x] **TASK-4.4.2:** Barrel export en `src/pkg/viz/index.ts`.

---

## Fase 5: SPEC-06 — Perfil Curvilíneo en Mapa ("Profiles along a line") (`pkg/curvilinear`) [COMPLETADO]
- [x] **TASK-6.1.1:** Definir tipos en `src/pkg/curvilinear/types.ts` (`CurvilinearProfileOptions`, `CurvilinearBarFeature`, `CurvilinearIsolineFeature`, `CurvilinearProfileModel`).
- [x] **TASK-6.1.2:** Implementar cálculo de vectores normales y suavizado gaussiano/laplaciano en `src/pkg/curvilinear/normals.ts`.
- [x] **TASK-6.2.1:** Implementar generación de la línea base paralela $B(s)$ en `src/pkg/curvilinear/generator.ts`.
- [x] **TASK-6.2.2:** Implementar extrusión ortogonal de cuadriláteros del histograma para cada bin $\text{BarPoly}_k$.
- [x] **TASK-6.2.3:** Implementar generación de isolíneas concéntricas de escala y rayos transversales de referencia.
- [x] **TASK-6.2.4:** Escribir suite de tests unitarios en `tests/unit/curvilinear/curvilinear.test.ts` (3 tests verificados).
- [x] **TASK-6.3.1:** Crear adaptador de capas para MapLibre en `src/pkg/curvilinear/maplibre-layers.ts` (barras, isolíneas, etiquetas numéricas de escala, resalte activo).
- [x] **TASK-6.3.2:** Integrar pastillas de control flotantes (Pills) sobre el mapa para alternar lado, métricas y offset.
- [x] **TASK-6.3.3:** Barrel export en `src/pkg/curvilinear/index.ts`.
- [x] **TASK-6.4.1:** Actualizar `src/ui/map-view.ts` para renderizar el perfil curvilíneo flotante en el mapa e interacción bidireccional.
- [x] **TASK-6.4.2:** Ajustar el layout de pantalla para dar protagonismo total al mapa con su gráfico curvilíneo integrado.
- [x] **TASK-6.4.3:** Verificar con `npm test` y compilación de producción en Vite (`dist/`).

---

## Fase 6: SPEC-07 — Diagnóstico & Render Cartográfico del Corredor y Perfil (`pkg/viz` & `ui/map-view`) [COMPLETADO]
- [x] **TASK-7.1.1:** Auditar y corregir `src/pkg/viz/maplibre-adapter.ts` (usar `FeatureCollection` válida para `source-highlight`).
- [x] **TASK-7.1.2:** Implementar doble trazo de alto contraste para el eje vial (`layer-alignment-casing` y `layer-alignment-line`).
- [x] **TASK-7.1.3:** Mejorar la visibilidad de siniestros viales como puntos con radio 7px, contorno blanco nítido y paleta MTC.
- [x] **TASK-7.1.4:** Configurar explícitamente el Web Worker de MapLibre GL JS v6 en Vite (`setWorkerUrl`) para resolver la omisión de fuentes GeoJSON.
- [x] **TASK-7.2.1:** Refactorizar `MapViewController` con ciclo de vida de renderizado resiliente (idempotencia en `style.load`, `load` y `isStyleLoaded()`).
- [x] **TASK-7.2.2:** Forzar `map.resize()` y encuadre `fitToAlignment()` con envolvente conjunta (eje vial + perfil curvilíneo).
- [x] **TASK-7.2.3:** Integrar diagnóstico de errores con logging explícito en `MapViewController`.
- [x] **TASK-7.2.4:** Implementar Selector de Trazados (`PE-1S`, `PE-1N`, `CUSTOM`) y botón de acción `⚡ Calcular Auditoría Vial (LRS)`.
- [x] **TASK-7.2.5:** Reposicionar leyenda cartográfica a cuadrante inferior izquierdo para despejar el campo visual.
- [x] **TASK-7.3.1:** Crear suite de pruebas unitarias en `tests/unit/viz/maplibre-render.test.ts`.
- [x] **TASK-7.3.2:** Validar con `npm test` y compilación de producción con Vite (`dist/`).
- [x] **TASK-7.3.3:** Verificación e inspección automatizada en navegador headless (CDP) con captura visual de pantalla libre de errores.

---

## Fase 7: SPEC-08 — Visibilidad de Puntos de Accidentes según Zoom (`pkg/viz` & `ui/map-view`) [COMPLETADO]
- [x] **TASK-8.1.1:** Configurar `minzoom: 13.5` para la capa `layer-crashes-points` en `src/pkg/viz/maplibre-adapter.ts`.
- [x] **TASK-8.1.2:** Ajustar interacciones de hover/click de puntos en `src/ui/map-view.ts` para que solo se activen en zoom >= 13.5.
- [x] **TASK-8.1.3:** Actualizar indicador de visibilidad de puntos en la leyenda en `index.html`.
- [x] **TASK-8.2.1:** Extender tests unitarios en `tests/unit/viz/maplibre-render.test.ts`.
- [x] **TASK-8.2.2:** Validar con `npm test` y compilación de producción con Vite.

---

## Fase 8: SPEC-09 — Límite de Zoom y Auto-Escalado Dinámico del Perfil (`pkg/curvilinear` & `ui/map-view`) [COMPLETADO]
- [x] **TASK-9.1.1:** Configurar `minZoom: 10.5` en MapLibre en `src/ui/map-view.ts`.
- [x] **TASK-9.1.2:** Implementar función `computeZoomScaleFactor` en `src/pkg/curvilinear/generator.ts`.
- [x] **TASK-9.1.3:** Conectar reactividad por evento de zoom en `MapViewController`.
- [x] **TASK-9.2.1:** Extender tests unitarios en `tests/unit/curvilinear/curvilinear.test.ts`.
- [x] **TASK-9.2.2:** Validar con `npm test` y compilación con Vite.

---

## Fase 9: SPEC-10 — Reloj Dinámico Circular de Rango Horario (`pkg/viz` & `ui/time-clock`) [COMPLETADO]
- [x] **TASK-10.1.1:** Actualizar `FilterState` en `src/pkg/viz/types.ts` con `timeRange`.
- [x] **TASK-10.1.2:** Actualizar filtrado temporal en `src/pkg/viz/store.ts` y añadir método `setTimeRange`.
- [x] **TASK-10.2.1:** Implementar componente `CircularTimeClockController` en `src/ui/time-clock.ts`.
- [x] **TASK-10.2.2:** Integrar `#time-clock-container` en `index.html` y reubicar la leyenda.
- [x] **TASK-10.2.3:** Añadir estilos CSS en `src/ui/styles.css`.
- [x] **TASK-10.2.4:** Instanciar reloj en `src/main.ts`.
- [x] **TASK-10.3.1:** Crear suite de pruebas unitarias en `tests/unit/viz/time-clock-filter.test.ts`.
- [x] **TASK-10.3.2:** Validar con `npm test` y compilación con Vite.

---

## Fase 10: SPEC-11 — Botón Semicircular Desplazable y Línea Conectora (`pkg/curvilinear` & `ui/map-view`) [COMPLETADO]
- [x] **TASK-11.1.1:** Implementar funciones geométricas en `src/pkg/curvilinear/pointer.ts`.
- [x] **TASK-11.1.2:** Configurar fuentes y capas para la línea conectora en MapLibre (`source-curvilinear-pointer-line`).
- [x] **TASK-11.2.1:** Crear e integrar el botón semicircular desplazable sobre la baseline $B(s)$.
- [x] **TASK-11.2.2:** Conectar interactividad de arrastre y click toggle para la línea conectora.
- [x] **TASK-11.3.1:** Crear tests unitarios en `tests/unit/curvilinear/pointer.test.ts`.
- [x] **TASK-11.3.2:** Validar con `npm test` y compilación con Vite.

---

## Fase 11: SPEC-12 — Botón Rectangular Desplazable de Ajuste Dinámico de Escala (`pkg/curvilinear` & `ui/map-view`) [COMPLETADO]
- [x] **TASK-12.1.1:** Implementar funciones geométricas `computeScaleHandleCoordinate` y `convertDragToHeightScale` en `src/pkg/curvilinear/pointer.ts`.
- [x] **TASK-12.1.2:** Crear e integrar el botón rectangular desplazable en `src/ui/map-view.ts`.
- [x] **TASK-12.1.3:** Conectar el arrastre transversal del botón rectangular con el ajuste de escala de extrusión en `VizStore`.
- [x] **TASK-12.2.1:** Sincronizar la posición longitudinal del botón rectangular con la progresiva $s$ del botón semicircular de SPEC-11.
- [x] **TASK-12.2.2:** Añadir estilos CSS para `.curvilinear-scale-handle-btn` en `src/ui/styles.css`.
- [x] **TASK-12.3.1:** Crear suite de pruebas unitarias en `tests/unit/curvilinear/scale-handle.test.ts`.
- [x] **TASK-12.3.2:** Validar con `npm test` y compilación con Vite.
