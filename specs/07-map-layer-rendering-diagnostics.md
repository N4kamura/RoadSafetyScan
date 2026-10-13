# SPEC-07: Diagnóstico, Estabilidad de Renderizado y Visualización Cartográfica del Corredor y Perfil

- **ID:** SPEC-07
- **Módulo:** `pkg/viz` & `ui/map-view`
- **Estado:** `IMPLEMENTED` (100% Tests Pass & Build Verified)
- **Trazabilidad:** [Constitution - Principle 4 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md#L29-L33)
- **Especificaciones Relacionadas:** [SPEC-02](file:///d:/Projects/RoadSafetyScan/specs/02-geometric-trace-alignment.md), [SPEC-03](file:///d:/Projects/RoadSafetyScan/specs/03-lrs-projection-engine.md), [SPEC-06](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Síntoma Observado por el Usuario
En la interfaz web de usuario, el contenedor cartográfico renderiza las teselas base de OpenStreetMap (frecuentemente asociadas a la apariencia clásica de Leaflet), pero **no se visualiza ninguno de los elementos vectoriales clave**:
1. El **trazo del eje vial de la carretera** no se aprecia sobre el mapa.
2. Los **accidentes viales (siniestros)** no aparecen representados como puntos espaciales.
3. El **perfil longitudinal curvilíneo** ("Profiles along a line") no se visualiza paralelamente al trazo.

#### 1.2 Análisis Causa Raíz
1. **Fallo en la Carga del Web Worker de MapLibre GL JS v6 en Vite (Causa Principal):**
   MapLibre GL JS delega el procesamiento de fuentes GeoJSON (triangulación de geometrías, indexación espacial y teselado GeoJSON-VT) a un Web Worker dedicado. En entornos Vite (ES modules), el worker integrado no se enlaza automáticamente por URL relativa, arrojando el error `Error: Worker failed to load. Check that the worker URL is correct`. Al fallar el worker, las teselas ráster de OpenStreetMap se cargan con normalidad ("solo veo el mapa"), pero **todas las fuentes vectoriales GeoJSON (eje, puntos de siniestros y barras curvilíneas) son ignoradas silenciosamente**, dejando el mapa sin trazos.
2. **Invalidación de Fuentes GeoJSON por Geometrías Vacías:**
   En `buildMapLibreConfig`, la fuente `source-highlight` se inicializaba con `{ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }` cuando no había rango resaltado activo. En la especificación RFC 7946, una `LineString` debe contener como mínimo 2 posiciones.
3. **Flujo de Interacción y Selección de Trazados:**
   El usuario requería un control explícito e intuitivo para seleccionar el trazado a auditar y disparar el cálculo de siniestros circundantes, observando la retroalimentación inmediata del motor LRS y la actualización gráfica simultánea.
4. **Dimensionamiento y Encuadre Óptimo (Bounding Box Unión):**
   El perfil curvilíneo se proyecta con una separación lateral $D_{\text{offset}}$ de hasta 2500 m. Encuadrar únicamente el bounding box de la carretera recortaba el perfil en pantalla o quedaba solapado por paneles de leyenda.

---

## 2. Requisitos Técnicos y Criterios de Aceptación

### 2.1 Requisito 7.1: Configuración Mandatoria del Worker de MapLibre en Vite
- Importar explícitamente el worker mediante `import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'`.
- Registrar la URL con `maplibregl.setWorkerUrl(maplibreWorkerUrl)` antes de instanciar cualquier mapa.
- Garantizar que el paquete de producción en Vite (`dist/`) emita el asset de worker autónomo sin errores 404 ni excepciones en consola.

### 2.2 Requisito 7.2: Validación Rigurosa de Fuentes GeoJSON (RFC 7946)
- Toda fuente sin datos activos (`source-highlight`) debe instanciarse como un `FeatureCollection` estándar válido con `features: []`.
- Ninguna geometría `LineString` o `Polygon` contendrá arrays vacíos o degenerados.

### 2.3 Requisito 7.3: Simbología Cartográfica de Alto Impacto y Contraste
1. **Trazo del Eje Vial (`layer-alignment-casing` y `layer-alignment-line`):**
   - Trazo base con color contrastante `#0284C7` (azul vial técnico) de 4.5px.
   - Casing/halo inferior `#0F172A` de 8px para garantizar visibilidad absoluta sobre cualquier fondo cartográfico OSM.
2. **Siniestros Viales como Puntos (`layer-crashes-points`):**
   - Geometría: `circle`.
   - Radio: 7px (8px en hover) con borde blanco nítido de 2px.
   - Colores reglamentarios MTC por severidad: Fatal (`#DC2626`), Graves (`#EA580C`), Leves (`#FACC15`), Solo Daños (`#2563EB`).
3. **Perfil Curvilíneo en Mapa (`layer-curvilinear-*`):**
   - Polígonos de barras visibles en púrpura VisQuill (`#7C3AED`) con opacidad 0.85 y contornos de 1px.
   - Línea base desplazada $B(s)$ continua de 2.5px (`#1E293B`).
   - Isolíneas curvas concéntricas discontinuas (`#64748B`, `line-dasharray: [3, 2]`).

### 2.4 Requisito 7.4: Selector de Trazados y Disparador de Auditoría Vial
- Integrar en la barra lateral un selector de corredores con opciones precargadas (`PE-1S`, `PE-1N`, `CUSTOM`).
- Integrar el botón de acción rápida `⚡ Calcular Auditoría Vial (LRS)` que recalcula inmediatamente los siniestros y actualiza el mapa.
- Reposicionar la leyenda cartográfica al cuadrante inferior izquierdo para despejar totalmente la visualización de los trazos.

### 2.5 Requisito 7.5: Encuadre Cartográfico Integral (Union Bounding Box)
- El método `fitToAlignment()` debe calcular la envolvente convexa combinada del eje vial y las barras del perfil curvilíneo para garantizar que ambos elementos aparezcan 100% visibles y centrados en pantalla.

---

## 3. Verificación y Casos de Prueba

| Caso de Prueba | Descripción | Criterio de Aceptación |
| :--- | :--- | :--- |
| **Test Case 7.1** | GeoJSON Conformity | Las fuentes de corredor y perfil no contienen geometrías vacías ilegales. |
| **Test Case 7.2** | Render Pipeline Completeness | Las capas de eje vial, siniestros y perfil curvilíneo se generan sin excepciones. |
| **Test Case 7.3** | Crash Points Count & Encoding | El mapa contiene exactamente los puntos de siniestros esperados con su codificación de color MTC. |
| **Test Case 7.4** | Headless Browser Verification | Verificación en navegador real con 0 excepciones, 11 capas activas y captura de pantalla. |

