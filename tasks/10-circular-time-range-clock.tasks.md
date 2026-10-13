# Tareas de Implementación: SPEC-10 — Reloj Dinámico Circular de Rango Horario

Este documento desglosa las tareas de ingeniería de software para cumplir con los criterios de aceptación de **SPEC-10**.

---

## Tareas

- [x] **TASK-10.1.1:** Actualizar `FilterState` en `src/pkg/viz/types.ts` para incorporar `timeRange?: { startMinute: number; endMinute: number } | null`.
- [x] **TASK-10.1.2:** Actualizar el filtrado de siniestros en `src/pkg/viz/store.ts` (`recomputeFilteredCrashes`) con soporte para intervalos diurnos y de cruce de medianoche, y añadir método `setTimeRange`.
- [x] **TASK-10.2.1:** Implementar el controlador UI `CircularTimeClockController` en `src/ui/time-clock.ts` con renderizado SVG del dial, franja blanca activa, perímetro negro inactivo, handles de arrastre, soporte de rotación continua y visualizador central de hora `HH:MM to HH:MM`.
- [x] **TASK-10.2.2:** Integrar el contenedor `#time-clock-container` en `index.html` en la esquina inferior izquierda del mapa y ajustar la posición de la leyenda cartográfica para evitar solapamiento.
- [x] **TASK-10.2.3:** Añadir estilos CSS en `src/ui/styles.css` para el reloj circular flotante.
- [x] **TASK-10.2.4:** Instanciar `CircularTimeClockController` en `src/main.ts`.
- [x] **TASK-10.3.1:** Crear suite de pruebas unitarias en `tests/unit/viz/time-clock-filter.test.ts`.
- [x] **TASK-10.3.2:** Validar con `npm test` y compilación de producción con Vite.
