# Tareas de Implementación: SPEC-08 — Visibilidad de Puntos de Accidentes según Zoom

Este documento desglosa las tareas de ingeniería de software para cumplir con los criterios de aceptación de **SPEC-08**.

---

## Tareas

- [x] **TASK-8.1.1:** Actualizar la interfaz de opciones y la función `buildMapLibreConfig` en `src/pkg/viz/maplibre-adapter.ts` para asignar `minzoom: 13.5` a la capa `layer-crashes-points`.
- [x] **TASK-8.1.2:** Actualizar `src/ui/map-view.ts` para asegurar que el comportamiento de popups e interacciones de `layer-crashes-points` solo se active cuando el mapa se encuentre en zoom >= 13.5.
- [x] **TASK-8.1.3:** Actualizar la leyenda cartográfica en `index.html` para indicar "(visible con zoom cercano)".
- [x] **TASK-8.2.1:** Actualizar y añadir pruebas unitarias en `tests/unit/viz/maplibre-render.test.ts` verificando la propiedad `minzoom` en la capa de puntos.
- [x] **TASK-8.2.2:** Validar con `npm test` y compilación de producción.
