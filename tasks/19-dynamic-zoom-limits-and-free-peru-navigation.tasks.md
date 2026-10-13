# Tareas de Implementación: SPEC-19 (Límites Dinámicos de Zoom y Navegación Libre por el Perú)

- **Especificación:** [`specs/19-dynamic-zoom-limits-and-free-peru-navigation.md`](file:///d:/Projects/RoadSafetyScan/specs/19-dynamic-zoom-limits-and-free-peru-navigation.md)
- **Módulos:** `pkg/tracer/route-manager`, `pkg/viz`, `ui/map-view`, `ui/sidebar`
- **Estado:** `COMPLETADO (IMPLEMENTED)`

---

## Tareas Técnicas Detalladas

### Fase 19.1: Modelo y Estado (RouteManager y VizStore)
- [x] **TASK-19.1.1:** Permitir `primaryRouteId: string | null` en `RouteManager` y actualizar `setPrimaryRoute(null | 'NONE')`.
- [x] **TASK-19.1.2:** Permitir `setAlignment(null)` en `VizStore` y asegurar limpieza de `lrsResults`.
- [x] **TASK-19.1.3:** Agregar pruebas unitarias en `route-manager.test.ts` y `store.test.ts` para deselección de ruta.

### Fase 19.2: Interfaz de Usuario y Barra Lateral
- [x] **TASK-19.2.1:** Agregar la opción `NONE` ("🗺️ Ninguna ruta (Exploración libre por el Perú)") en `#select-corridor-trace` en `index.html` y en `syncCorridorSelector()`.
- [x] **TASK-19.2.2:** Actualizar `#header-corridor-badge` cuando no haya ruta activa ("🗺️ Exploración Libre (Perú)").
- [x] **TASK-19.2.3:** Permitir desmarcar la ruta primaria desde la tarjeta en `#routes-manager-list`.

### Fase 19.3: Controlador de Mapa y Límites de Zoom Dinámicos
- [x] **TASK-19.3.1:** Implementar método `updateZoomLimits()` en `MapViewController` conmutando entre `minZoom: 10.5` (con ruta) y `minZoom: 4.0` (sin ruta).
- [x] **TASK-19.3.2:** Vaciar capas geométricas del corredor y perfil curvilíneo cuando `state.alignment === null`.
- [x] **TASK-19.3.3:** Ocultar puntero de cadenamiento y handle de escala cuando no haya ruta activa.
- [x] **TASK-19.3.4:** Actualizar `fitToAlignment()` para encuadrar la extensión nacional de Perú cuando no haya ruta activa (`[-75.0, -9.19]`, zoom `5.2`).

### Fase 19.4: Pruebas y Validación
- [x] **TASK-19.4.1:** Crear suite de tests `tests/unit/viz/dynamic-zoom-limits.test.ts`.
- [x] **TASK-19.4.2:** Ejecutar suite completa con `npm test` y verificar 100% aprobadas.
- [x] **TASK-19.4.3:** Ejecutar compilación de producción con `npm run build`.
