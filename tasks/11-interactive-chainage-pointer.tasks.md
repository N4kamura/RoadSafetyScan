# Tareas de Implementación: SPEC-11 — Botón Semicircular Desplazable y Línea Conectora

Este documento desglosa las tareas de ingeniería de software para cumplir con los criterios de aceptación de **SPEC-11**.

---

## Tareas

- [x] **TASK-11.1.1:** Implementar funciones geométricas en `src/pkg/curvilinear/pointer.ts` para calcular la posición sobre el eje $P(s)$, la posición sobre la baseline $B(s)$ y el ángulo de orientación normal para un cadenamiento $s$.
- [x] **TASK-11.1.2:** Crear fuentes y capas de MapLibre para la línea conectora (`source-curvilinear-pointer-line` y `layer-curvilinear-pointer-line`).
- [x] **TASK-11.2.1:** Implementar el elemento interactivo del botón semicircular desplazable (con diseño SVG negro y dos franjas blancas) y añadir soporte para arrastre y clic toggle en `src/ui/map-view.ts`.
- [x] **TASK-11.2.2:** Sincronizar el arrastre del botón con la progresiva vial $s$ y actualizar la línea conectora hacia la carretera en tiempo real.
- [x] **TASK-11.3.1:** Crear suite de tests unitarios en `tests/unit/curvilinear/pointer.test.ts`.
- [x] **TASK-11.3.2:** Validar con `npm test` y compilación de producción con Vite.
