# Plan de Tareas: SPEC-33 — Alineación de Controles Duales y Seguimiento a la Mira del Viewport

Este plan define las tareas ejecutables bajo TDD para garantizar la alineación transversal estricta de ambos botones y su seguimiento dinámico al centro del viewport durante la navegación.

---

## Tareas

- [x] `TASK-33.1`: En `src/ui/map-view.ts`, implementar la sincronización coaxial estricta de ambos botones (`pointerMarker` y `scaleHandleMarker`), asegurando que compartan siempre la misma progresiva vial `currentPointerChainage` y el mismo vector normal director.
- [x] `TASK-33.2`: Implementar el mecanismo de seguimiento a la mira (*viewport sight tracking*) en los eventos de navegación (`moveend`, actualización de vista y zoom), recalculando `currentPointerChainage` como la mediana del rango visible en pantalla cuando no haya arrastre manual activo.
- [x] `TASK-33.3`: Crear suite de pruebas unitarias en `tests/unit/curvilinear/aligned-controls-sight-tracking.test.ts` verificando:
  - Coaxialidad transversal estricta de ambos marcadores a lo largo de la normal.
  - Actualización automática al punto medio del tramo visible durante la navegación.
  - Suspensión de seguimiento automático durante el arrastre directo con el mouse.
- [x] `TASK-33.4`: Validar con `npm test` (151 tests pasando) y compilación de producción con Vite.
