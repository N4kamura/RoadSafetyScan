# Tareas de Implementación: SPEC-12 — Botón Rectangular Desplazable de Ajuste Dinámico de Escala

Este documento desglosa las tareas de ingeniería de software para cumplir con los criterios de aceptación de **SPEC-12**.

---

## Tareas

- [x] **TASK-12.1.1:** Implementar funciones geométricas `computeScaleHandleCoordinate` y `convertDragToHeightScale` en `src/pkg/curvilinear/pointer.ts`.
- [x] **TASK-12.1.2:** Crear e integrar el botón rectangular desplazable (con diseño SVG negro y tres ranuras blancas `≡`) en `src/ui/map-view.ts`.
- [x] **TASK-12.1.3:** Conectar el arrastre transversal del botón rectangular con el ajuste de escala de extrusión en `VizStore` (`curvilinearHeightScale`).
- [x] **TASK-12.2.1:** Sincronizar la posición longitudinal del botón rectangular con la progresiva $s$ del botón semicircular de SPEC-11.
- [x] **TASK-12.2.2:** Añadir estilos CSS para `.curvilinear-scale-handle-btn` en `src/ui/styles.css`.
- [x] **TASK-12.3.1:** Crear suite de pruebas unitarias en `tests/unit/curvilinear/scale-handle.test.ts`.
- [x] **TASK-12.3.2:** Validar con `npm test` y compilación de producción con Vite.
