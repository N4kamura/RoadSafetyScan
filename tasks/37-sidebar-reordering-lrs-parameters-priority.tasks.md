# Tareas de Implementación - SPEC-37: Reorganización del Panel Lateral (Prioridad Parámetros LRS)

- [x] **TASK-37.1: Reestructuración de Secciones en `index.html`**
  - Mover la sección `<section class="sidebar-section">` de Parámetros LRS (Buffer y $\Delta S$) inmediatamente después del bloque de Rutas y Trazados Viales (después de `#routes-manager-list`).
  - Separar el Diagnóstico del Corredor (KPIs y Dimensión a graficar) en su propia sección posterior a los Parámetros LRS.
  - Asegurar que todos los IDs, clases y selectores de accesibilidad se mantengan idénticos.

- [x] **TASK-37.2: Verificación de Comportamiento e Integración**
  - Verificar que los event listeners en `src/ui/sidebar.ts` se inicialicen sin errores.
  - Verificar que el colapso y redimensionamiento del sidebar siga funcionando perfectamente.

- [x] **TASK-37.3: Ejecución de Tests y Compilación**
  - Ejecutar `npm test` y verificar 100% de éxito.
  - Ejecutar `npm run build` y verificar bundle de producción.
