# Tareas de Implementación: SPEC-09 — Límite de Zoom y Auto-Escalado Dinámico del Perfil

Este documento desglosa las tareas de ingeniería de software para cumplir con los criterios de aceptación de **SPEC-09**.

---

## Tareas

- [x] **TASK-9.1.1:** Configurar `minZoom: 10.5` en las opciones de inicialización de MapLibre en `src/ui/map-view.ts`.
- [x] **TASK-9.1.2:** Implementar la función geométrica `computeZoomScaleFactor(zoom, refZoom, gamma, maxFactor)` en `src/pkg/curvilinear/generator.ts` y exportarla.
- [x] **TASK-9.1.3:** Conectar el evento `zoom` / `zoomend` en `MapViewController` (`src/ui/map-view.ts`) para recalcular el perfil curvilíneo con la escala adaptada cuando se aleja el zoom.
- [x] **TASK-9.2.1:** Implementar suite de tests unitarios en `tests/unit/curvilinear/curvilinear.test.ts` para verificar la función de escalado según zoom.
- [x] **TASK-9.2.2:** Validar con `npm test` y compilación de producción.
