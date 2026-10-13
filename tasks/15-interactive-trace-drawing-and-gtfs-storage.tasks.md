# Tareas de Implementación: SPEC-15 (Herramienta Interactiva de Trazo y Almacenamiento GTFS/.txt)

- **Especificación:** [`specs/15-interactive-trace-drawing-and-gtfs-storage.md`](file:///d:/Projects/RoadSafetyScan/specs/15-interactive-trace-drawing-and-gtfs-storage.md)
- **Módulos:** `pkg/tracer`, `pkg/export`, `pkg/viz`, `ui`
- **Estado:** `COMPLETADO (IMPLEMENTED)`

---

## Tareas Técnicas Detalladas

### Fase 15.1: Conversión de Rutas Existentes y Estructura en Carpeta `routes/`
- [x] **TASK-15.1.1:** Crear script `scripts/generate_gtfs_and_routes.py` para exportar las rutas `PE-1S` y `PE-1N` a la carpeta `routes/` y `public/routes/`.
- [x] **TASK-15.1.2:** Generar `routes.txt`, `shapes.txt`, `trips.txt`, `agency.txt`, `PE-1S.txt`, `PE-1N.txt` y `manifest.json`.

### Fase 15.2: Parsers y Serializadores GTFS y TXT (`pkg/tracer` y `pkg/export`)
- [x] **TASK-15.2.1:** Implementar importador de GTFS (`routes.txt` y `shapes.txt`) en `src/pkg/tracer/importers/gtfs.ts`.
- [x] **TASK-15.2.2:** Implementar importador de archivos planos `.txt` en `src/pkg/tracer/importers/txt.ts`.
- [x] **TASK-15.2.3:** Implementar exportador de GTFS en `src/pkg/export/gtfs.ts`.
- [x] **TASK-15.2.4:** Implementar exportador de `.txt` en `src/pkg/export/txt.ts`.
- [x] **TASK-15.2.5:** Crear pruebas unitarias en `tests/unit/tracer/gtfs-importer.test.ts`, `tests/unit/tracer/txt-importer.test.ts`, `tests/unit/export/gtfs-export.test.ts` y `tests/unit/export/txt-export.test.ts`.

### Fase 15.3: Herramienta Interactiva de Trazo de Perfil (`src/ui/trace-drawer.ts`)
- [x] **TASK-15.3.1:** Crear controlador `TraceDrawerController` para captura interactiva de vértices sobre MapLibre.
- [x] **TASK-15.3.2:** Integrar barra de herramientas flotante de digitalización con medidor de longitud en tiempo real, botones de deshacer, cancelar y guardar.
- [x] **TASK-15.3.3:** Implementar modal de guardado de ruta (Código, Nombre, Color) y persistencia en `localStorage`.
- [x] **TASK-15.3.4:** Añadir descarga directa de `.txt` y GTFS al finalizar un trazo.

### Fase 15.4: Gestor de Rutas Activas en el Mapa (`src/ui/sidebar.ts`, `src/ui/map-view.ts`, `index.html`)
- [x] **TASK-15.4.1:** Renderizar todas las rutas activas seleccionadas como capas de polilíneas diferenciadas en el mapa.
- [x] **TASK-15.4.2:** Integrar panel de "Gestor de Rutas" con casillas de verificación para alternar visibilidad de cada ruta en el mapa.
- [x] **TASK-15.4.3:** Permitir seleccionar la ruta de análisis primario tanto desde la lista como haciendo clic directo sobre el trazo en el mapa.
- [x] **TASK-15.4.4:** Actualizar estilos CSS en `src/ui/styles.css`.

### Fase 15.5: Verificación y Pruebas
- [x] **TASK-15.5.1:** Ejecutar suite completa de pruebas unitarias (`npm test`).
- [x] **TASK-15.5.2:** Validar compilación de producción con Vite (`npm run build`).
