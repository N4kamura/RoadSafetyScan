# SPEC-19: Límites Dinámicos de Zoom y Navegación Libre por el Perú

- **ID:** SPEC-19
- **Módulo:** `pkg/tracer/route-manager`, `pkg/viz`, `ui/map-view`, `ui/sidebar`
- **Estado:** `FROZEN`
- **Trazabilidad:** [Constitution - Principle 4 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md#L29-L33)
- **Especificaciones Relacionadas:** [SPEC-09](file:///d:/Projects/RoadSafetyScan/specs/09-zoom-limits-and-autoscale.md), [SPEC-15](file:///d:/Projects/RoadSafetyScan/specs/15-interactive-trace-drawing-and-gtfs-storage.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Contexto y Necesidad del Usuario
En la especificación **SPEC-09**, se fijó un límite inferior estricto de alejamiento en el mapa (`minZoom: 10.5`) para prevenir que las barras del histograma curvilíneo perdieran escala al alejarse excesivamente del corredor vial en análisis.

Sin embargo, cuando el usuario no tiene ninguna ruta seleccionada o desea explorar otras regiones del territorio nacional (ciudades de la costa, sierra o selva del Perú como Piura, Trujillo, Arequipa, Cusco, Iquitos o Puno), el límite fijo `minZoom: 10.5` bloquea el zoom out e impide tener una visión panorámica de todo el Perú, dificultando gravemente el desplazamiento hacia zonas remotas.

El usuario reporta:
> *"Cuando no tengo seleccionado ninguna ruta, me permita alejar el Zoom. Esto es para que las personas les sea más fácil navegar por todo el Perú, actualmente el zoom más alejado está fijo y eso molesta la navegación a lugares lejanos."*

---

## 2. Requisitos Técnicos y Criterios de Aceptación

### 2.1 Requisito 19.1: Soporte de Estado "Sin Ruta Seleccionada" en `RouteManager` y `VizStore`
- `RouteManager.getPrimaryRoute()` debe poder retornar `null` cuando no haya una ruta primaria activa (`primaryRouteId: string | null`).
- `RouteManager.setPrimaryRoute(null | 'NONE')` desactiva la ruta primaria, estableciendo `isPrimary = false` en todas las rutas y notificando a los suscriptores.
- `VizStore.setAlignment(null)` debe ser completamente soportado, actualizando el estado a `alignment: null`, `lrsResults: null` y emitiendo el evento `ALIGNMENT_CHANGED`.

### 2.2 Requisito 19.2: Opción "Ninguna Ruta (Exploración Libre)" en la Interfaz
- El selector de corredor en la barra lateral (`#select-corridor-trace`) debe incluir una opción de cabecera:
  ```html
  <option value="NONE">🗺️ Ninguna ruta (Exploración libre por el Perú)</option>
  ```
- Al seleccionar `NONE`, se desactiva la ruta primaria (`routeManager.setPrimaryRoute(null)` y `store.setAlignment(null)`).
- El badge de la cabecera (`#header-corridor-badge`) mostrará el texto:
  `🗺️ Exploración Libre (Perú)` con estilo armonizado.
- En la lista de tarjetas de rutas del gestor (`#routes-manager-list`), cuando una ruta esté activa, el botón de selección permitirá conmutar o desmarcar la ruta activa.

### 2.3 Requisito 19.3: Desacoplamiento Dinámico de `minZoom` según Selección de Ruta
En el controlador del mapa (`MapViewController`):
- **Con Ruta Seleccionada (`state.alignment !== null`):**
  - Aplicar `map.setMinZoom(10.5)` para preservar la estabilidad geométrica del perfil curvilíneo y sus isolíneas según SPEC-09.
- **Sin Ruta Seleccionada (`state.alignment === null`):**
  - Aplicar `map.setMinZoom(4.0)` (o hasta 3.5), permitiendo al usuario alejar el mapa para visualizar la totalidad del territorio peruano (de Tumbes a Tacna).
  - Al ejecutar `fitToAlignment()` sin ruta activa (o presionar el botón de recentrar `#btn-fit-map`), el mapa transiciona suavemente hacia la vista nacional de Perú:
    - Centro aproximado: `[-75.0, -9.19]`
    - Zoom: `5.2`

### 2.4 Requisito 19.4: Limpieza e Idempotencia de Capas Geométricas
Cuando el estado cambie a `alignment === null`:
- Las fuentes de datos de corredor (`source-alignment`, `source-buffer`, `source-highlight`) y de perfil curvilíneo (`source-curvilinear-bars`, `source-curvilinear-isolines`, `source-curvilinear-connectors`, `source-curvilinear-labels`) se vacían limpiamente enviando `{ type: 'FeatureCollection', features: [] }`.
- Los marcadores interactivos (puntero semicircular de cadenamiento y handle de escala transversal) se ocultan o retiran del mapa.
- Las capas de puntos de accidentes reales (`crashes`) permanecen intactas en su fuente espacial para que el usuario pueda explorarlas a lo largo de todo el Perú.
- El panel longitudinal (`profile-view.ts`) muestra el mensaje:
  *"Seleccione o dibuje una ruta para generar el perfil longitudinal."* sin emitir excepciones de consola.

---

## 3. Matriz de Verificación y Criterios de Aceptación (DoD)
1. **Tests unitarios:**
   - `tests/unit/tracer/route-manager.test.ts` verifica que `setPrimaryRoute(null)` y `setPrimaryRoute('NONE')` desactivan la ruta primaria correctamente.
   - `tests/unit/viz/store.test.ts` verifica que `store.setAlignment(null)` borra `lrsResults` y emite el evento sin errores.
   - `tests/unit/viz/dynamic-zoom-limits.test.ts` verifica que la lógica de cálculo y ajuste de zoom mínimo alterna entre `10.5` (con ruta) y `4.0` (sin ruta).
2. **Navegación e Integración:**
   - La aplicación inicia y compila con 0 errores de TypeScript (`npm run build`).
   - 100% de las pruebas automatizadas pasan en `npm test`.
