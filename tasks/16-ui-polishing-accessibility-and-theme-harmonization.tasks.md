# Tareas de Implementación: SPEC-16 (Limpieza de Interfaz, Contraste y Armonización Visual)

- **Especificación:** [`specs/16-ui-polishing-accessibility-and-theme-harmonization.md`](file:///d:/Projects/RoadSafetyScan/specs/16-ui-polishing-accessibility-and-theme-harmonization.md)
- **Módulos:** `ui`, `pkg/viz`
- **Estado:** `COMPLETADO (IMPLEMENTED)`

---

## Tareas Técnicas Detalladas

### Fase 16.1: Retiro de Artefactos de Desarrollo de la Interfaz
- [x] **TASK-16.1.1:** Retirar el badge `SPEC-15: Trazo & GTFS` de la cabecera en `index.html`.
- [x] **TASK-16.1.2:** Limpiar cualquier insignia o texto interno de especificación de la vista principal del usuario.

### Fase 16.2: Refactorización de Estilos y Corrección de Contraste
- [x] **TASK-16.2.1:** Desacoplar estilos de botones de cabecera (`.app-header .btn-secondary`, `.app-header .btn-outline`) de los botones de paneles interiores.
- [x] **TASK-16.2.2:** Corregir el contraste tipográfico de los botones de **Dimensión a Graficar en Barras** (`.btn-metric-selector`).
- [x] **TASK-16.2.3:** Corregir el color y visibilidad del botón **Minimizar** en el perfil longitudinal (`#btn-toggle-profile-panel`).
- [x] **TASK-16.2.4:** Corregir el color y contraste de los botones rápidos de años (`#btn-year-all`, `#btn-year-latest`, `#btn-year-clear`) y los chips de años (`.year-chip-item`).

### Fase 16.3: Sistema de Temas Semánticos (Modo Claro / Modo Oscuro)
- [x] **TASK-16.3.1:** Configurar variables semánticas en `:root` para modo claro y reglas completas para modo oscuro (`@media (prefers-color-scheme: dark)` y `[data-theme="dark"]`).
- [x] **TASK-16.3.2:** Añadir botón interactivo de alternancia de tema (`🌓`) en la cabecera con persistencia en `localStorage`.

### Fase 16.4: Limpieza y Pulido Visual Integral (UI Polish)
- [x] **TASK-16.4.1:** Pulir layout, tarjetas de KPI, listas de rutas y secciones del panel lateral.
- [x] **TASK-16.4.2:** Pulir el panel del perfil longitudinal y el modal de información.

### Fase 16.5: Verificación y Pruebas
- [x] **TASK-16.5.1:** Ejecutar suite completa de tests (`npm test`).
- [x] **TASK-16.5.2:** Validar compilación de producción con Vite (`npm run build`).
