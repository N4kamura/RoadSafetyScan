# Tareas de Implementación: SPEC-13 — Filtro Temporal por Años de Siniestros Viales

Este documento desglosa las tareas de ingeniería de software para cumplir con los criterios de aceptación de **SPEC-13**.

---

## Tareas

- [x] **TASK-13.1.1:** Extender `FilterState` en `src/pkg/viz/types.ts` con la propiedad opcional `selectedYears?: number[]`.
- [x] **TASK-13.1.2:** Implementar la lógica de filtrado por años en `recomputeFilteredCrashes()` y métodos auxiliares `getAvailableYears()` y `setSelectedYears()` en `src/pkg/viz/store.ts`.
- [x] **TASK-13.2.1:** Distribuir los datos de prueba en `src/mock-data.ts` y `mock/crashes.json` a lo largo de los años 2021, 2022, 2023 y 2024 con años y marcas de tiempo (`timestamp`) coherentes.
- [x] **TASK-13.3.1:** Agregar la sección de marcado HTML en `index.html` para el filtro de años en el panel lateral (`#section-year-filter`).
- [x] **TASK-13.3.2:** Añadir estilos CSS en `src/ui/styles.css` para los chips y botones rápidos de selección de años.
- [x] **TASK-13.4.1:** Implementar el controlador reactivo de años en `src/ui/sidebar.ts` con soporte para selección múltiple, botones "Todos", "Último Año" y "Limpiar", y reactividad ante `FILTERS_UPDATED` y `CRASHES_LOADED`.
- [x] **TASK-13.5.1:** Crear suite de pruebas unitarias exhaustivas en `tests/unit/viz/year-filter.test.ts`.
- [x] **TASK-13.5.2:** Validar con `npm test`, compilar con `npm run build`, verificar funcionamiento en navegador y confirmar en Git local.
