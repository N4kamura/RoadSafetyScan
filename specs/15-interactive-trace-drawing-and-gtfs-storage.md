# SPEC-15: Herramienta Interactiva de Trazo de Perfil, Almacenamiento en Formato GTFS (`routes.txt` / `shapes.txt`), Archivos `.txt` y Gestor de Rutas Activas en Mapa

- **ID:** SPEC-15
- **Módulo:** `pkg/tracer`, `pkg/export`, `pkg/viz`, `ui`
- **Estado:** `COMPLETADO (IMPLEMENTED)`
- **Trazabilidad:** [Constitution - Principles 1, 2, 3, 4, 5 & Modules 2, 4, 5](file:///d:/Projects/RoadSafetyScan/constitution.md)
- **Especificaciones Relacionadas:** [SPEC-02](file:///d:/Projects/RoadSafetyScan/specs/02-geometric-trace-alignment.md), [SPEC-05](file:///d:/Projects/RoadSafetyScan/specs/05-export-interoperability.md), [SPEC-06](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md), [SPEC-07](file:///d:/Projects/RoadSafetyScan/specs/07-map-layer-rendering-diagnostics.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Contexto de los Trazos de Perfil y el Estándar GTFS
En la gestión e investigación de la seguridad vial en Perú, los auditores viales necesitan analizar diferentes corredores viales, carreteras y avenidas urbanas. Anteriormente, los alineamientos estaban restringidos a datos precargados en código o a la importación manual de archivos GeoJSON.

Para brindar autonomía completa a los analistas de entidades públicas (MTC, SUTRAN, ATU, Gobiernos Regionales):
1. Es imperativo contar con una **herramienta interactiva de trazo sobre el mapa** que permita digitalizar en tiempo real el eje o corredor vial que servirá de referencia longitudinal para el cálculo LRS (*Linear Referencing System*) y el perfil curvilíneo (*VisQuill Profiles along a line*).
2. Los trazos deben estandarizarse y almacenarse en formatos interoperables de amplia adopción:
   - **Formato GTFS (General Transit Feed Specification):** Específicamente `routes.txt` (metadatos de las rutas como ID, nombre, color, descripción) y `shapes.txt` (geometría georreferenciada con latitud, longitud, secuencia ordinal y distancia acumulada calculada).
   - **Formato de Texto Plano (`.txt`):** Archivos tabulares individuales con columnas claras (`index,longitude,latitude,cumulative_meters,station`) legibles por herramientas CAD, GIS y hojas de cálculo sin dependencias externas.
3. El usuario debe poder **visualizar y gestionar múltiples rutas en el mapa**, decidiendo cuáles mostrar activas simultáneamente sobre el lienzo cartográfico y cuál seleccionar como la ruta principal sujeta a auditoría longitudinal LRS.

### 1.2 Requerimiento del Usuario
> *"Agrega una nueva SPEC, necesito tener una herramienta para crear el trazo del perfil. Que los trazos se guarden en una carpeta y deben estar en formato .txt y en formato de routes.txt de GTFS (asi se llaman creo). El usuario puede escoger las rutas activas en el mapa. Las que estan ahora déjalas pero conviértelas en en el formato GTFS también. Cualquier consulta me avisas."*

---

## 2. Requisitos Técnicos y Arquitectura

### 2.1 Requisito 15.1: Carpeta de Rutas y Formatos de Almacenamiento (`routes/` y `public/routes/`)
Se define una carpeta centralizada `routes/` (y su réplica estática web en `public/routes/`) donde se almacenan:
1. **`routes.txt` (GTFS):**
   ```csv
   route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_color,route_text_color
   PE-1S,MTC,"PE-1S","Corredor Panamericana Sur (Km 18 al 25)","Carretera Panamericana Sur tramo Lima Sur",3,2563EB,FFFFFF
   PE-1N,MTC,"PE-1N","Corredor Panamericana Norte (Km 35 al 41)","Carretera Panamericana Norte tramo Lima Norte",3,10B981,FFFFFF
   ```
2. **`shapes.txt` (GTFS):**
   ```csv
   shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled
   PE-1S,-12.180000,-76.960000,1,0.00
   PE-1S,-12.185000,-76.958000,2,596.96
   ...
   ```
3. **`trips.txt` y `agency.txt` (GTFS):**
   Archivos complementarios del feed estándar GTFS para garantizar interoperabilidad completa con herramientas de transporte.
4. **Archivos individuales `.txt` (`PE-1S.txt`, `PE-1N.txt`, `<route_id>.txt`):**
   ```csv
   # RoadSafetyScan - Trazo de Alineamiento Vial: PE-1S
   # Nombre: Corredor Panamericana Sur (Km 18 al 25)
   index,longitude,latitude,cumulative_meters,station
   0,-76.960000,-12.180000,0.00,km 0+000.00
   1,-76.958000,-12.185000,596.96,km 0+596.96
   ...
   ```
5. **`manifest.json`:** Índice de metadatos de rutas para facilitar la carga asíncrona client-side por parte de la aplicación web.

### 2.2 Requisito 15.2: Módulo de Importación y Exportación GTFS / TXT (`pkg/tracer` y `pkg/export`)
- **Importadores (`src/pkg/tracer/importers/`):**
  - `gtfs.ts`: Parsea pares de texto `routes.txt` y `shapes.txt` convirtiéndolos en colecciones de objetos `Alignment` tipados.
  - `txt.ts`: Parsea archivos tabulares de texto con coordenadas y progresivas opcionales, tolerando encabezados o coordenadas directas `lon,lat`.
- **Exportadores (`src/pkg/export/`):**
  - `gtfs.ts`: Genera contenido string estándar para `routes.txt` y `shapes.txt` a partir de cualquier lista de objetos `Alignment`.
  - `txt.ts`: Genera el archivo plano estructurado `.txt` para cualquier alineamiento con formato de progresiva MTC (`km K+PPP.PP`).

### 2.3 Requisito 15.3: Herramienta Interactiva de Trazo de Perfil (`ui/trace-drawer.ts`)
- **Modo Digitalización:** Activado mediante botón `✏️ Trazar Nuevo Perfil` en la cabecera o panel lateral.
- **Interacción en el Mapa:**
  - El cursor cambia a `crosshair`.
  - Cada clic sobre el lienzo agrega un vértice $V_i = (\lambda_i, \phi_i)$.
  - Se dibuja una polilínea interactiva temporal y marcadores visuales en cada vértice.
  - Una barra de estado superior muestra en vivo:
    - Cantidad de vértices digitalizados.
    - Longitud acumulada en kilómetros.
    - Controles rápidos: `✓ Finalizar y Guardar`, `↶ Deshacer Punto`, `✕ Cancelar`.
- **Finalización y Creación:**
  - Valida un mínimo de 2 vértices no degenerados.
  - Solicita metadatos: Código de Ruta (ej. `CR-01`), Nombre Descriptivo y Color representativo.
  - Genera automáticamente el objeto `Alignment` con distancias acumuladas geodésicas y bounding box.
  - Guarda la nueva ruta en el almacenamiento local del navegador (`localStorage`) para persistencia entre sesiones.
  - Genera y descarga los archivos correspondientes en `.txt` y GTFS (`routes.txt` / `shapes.txt`).
  - Activa de inmediato la ruta creada en el mapa y la selecciona como eje activo para el perfil curvilíneo LRS.

### 2.4 Requisito 15.4: Gestor de Rutas Activas en el Mapa (`ui/sidebar.ts` y `ui/map-view.ts`)
- **Visibilidad Múltiple de Rutas:**
  - El usuario puede marcar con casillas de verificación (checkboxes) cuáles rutas desea tener visibles en el mapa simultáneamente.
  - Cada ruta activa se dibuja con su color distintivo y una etiqueta visual en el mapa.
  - Al hacer clic sobre cualquier ruta en el mapa, esta se selecciona como la ruta activa de análisis.
- **Ruta Principal de Análisis:**
  - El selector permite elegir cuál de las rutas visibles es el eje de referencia para:
    - El perfil curvilíneo paralelo (*VisQuill Profiles along a line*).
    - El puntero semicircular y la línea conectora (SPEC-11).
    - El botón de ajuste de escala transversal (SPEC-12).
    - Los KPIs y métricas de siniestralidad vial (SPEC-14).

---

## 3. Modelo Matemático y Geodésico

### 3.1 Longitud y Formateo de Progresivas
Para cada secuencia de coordenadas capturadas:
$$S_0 = 0$$
$$S_k = S_{k-1} + d_{\text{haversine}}(V_{k-1}, V_k), \quad k \ge 1$$

Cada vértice se etiqueta con la progresiva vial según norma MTC DG-2018:
$$\text{Estación}(S) = \text{"km } \lfloor S/1000 \rfloor + (S \pmod{1000})\text{"}$$

### 3.2 Sanidad Geométrica del Trazo Manual
- Se filtran automáticamente vértices consecutivos con distancia $< 0.10\text{ m}$.
- Se calculan azimuts geodésicos entre segmentos contiguos.
- Se detectan auto-intersecciones y giros de deflexión agudos ($> 150^\circ$) emitiendo advertencias no bloqueantes.

---

## 4. Criterios de Aceptación (Definition of Done)

1. **Persistencia de Archivos:**
   - La carpeta `routes/` y `public/routes/` contiene `routes.txt`, `shapes.txt`, `PE-1S.txt`, `PE-1N.txt`, `trips.txt`, `agency.txt` y `manifest.json`.
2. **Pruebas Unitarias de Importación/Exportación:**
   - Parser de GTFS reconstruye fielmente alineamientos a partir de `routes.txt` y `shapes.txt`.
   - Parser de `.txt` reconstruye alineamientos a partir de coordenadas tabulares.
   - Generadores de exportación producen texto conforme a la especificación estándar.
3. **Experiencia de Usuario en el Mapa:**
   - Herramienta de trazo permite digitalizar polilíneas punto por punto con vista previa en vivo.
   - Posibilidad de deshacer el último punto o cancelar el trazo.
   - El usuario puede activar/desactivar múltiples rutas visibles en el mapa.
   - Al seleccionar una ruta activa, el cálculo LRS y el perfil curvilíneo se actualizan reactivamente.
4. **Verificación de Calidad:**
   - 100% de tests unitarios pasando en Vitest.
   - Compilación exitosa en Vite sin advertencias de tipos.
