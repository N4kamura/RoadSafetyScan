# 🛣️ RoadSafetyScan - Perfil Curvilíneo de Seguridad Vial

Plataforma geoespacial de código abierto diseñada para la auditoría, análisis y visualización avanzada de siniestralidad vial en carreteras y vías urbanas del Perú. 

Implementa algoritmos de **Referenciación Lineal (LRS)**, proyección ortogonal geodésica (WGS84 / Haversine) según normativas del **MTC (DG-2018)** y el paradigma visual de vanguardia **Profiles along a line (VisQuill GDK A1 Collision Density)**.

La aplicación opera bajo arquitectura **Local-First & Client-Side**: todo el procesamiento geométrico, filtrado espacial y renderizado cartográfico se ejecuta directamente en el navegador del usuario final sin dependencias de servidores backend propietarios.

---

## 📊 Base de Datos Incluida (ONSV - MTC Perú)

El proyecto viene **completamente precargado y configurado** con los datos oficiales procesados del **Observatorio Nacional de Seguridad Vial (ONSV)** del Ministerio de Transportes y Comunicaciones (MTC):

1. **Base SQLite3 Consolidada (`db/roadsafety.db`):**  
   Base de datos relacional que consolida los registros históricos (2021-2025) de las matrices oficiales de:
   - Siniestros viales con georreferenciación y clasificación de severidad.
   - Vehículos involucrados por tipo y clase.
   - Personas involucradas con desglose de condición y gravedad (*Fallecido*, *Lesionado*, *Ileso*, *No se conoce*).

2. **Dataset Web Optimizado (`public/data/crashes_web.json`):**  
   Archivo indexado espacialmente que se sirve estáticamente para carga instantánea en el navegador web con miles de incidentes reales georreferenciados.

3. **Ruta de Ejemplo Precargada:**  
   - **Ruta de Ejemplo (Panamericana Sur - Km 18 al 25):** Trazo de referencia de 7.6 km para análisis inmediato de densidad de accidentes y personas en el tramo sur de Lima.

4. **Interoperabilidad GTFS y Trazos (`routes/` y `public/routes/`):**  
   - Archivos estándar GTFS: `routes.txt`, `shapes.txt`, `trips.txt`, `agency.txt` y `manifest.json`.
   - Trazo de alineamiento en texto plano: `ruta_ejemplo.txt`.

---

## 📋 Requisitos Previos

Antes de iniciar, asegúrate de contar con las siguientes herramientas en tu equipo:

- **Node.js:** Versión 18.0.0 o superior (recomendado Node 20 LTS o superior).  
  Verifica tu versión instalada con:
  ```bash
  node -v
  ```
- **npm:** Gestor de paquetes incluido con Node.js (versión 9 o superior).
- **Navegador Web Moderno:** Google Chrome, Microsoft Edge, Mozilla Firefox o Safari con soporte para WebGL (requerido para MapLibre GL JS).
- *(Opcional)* **Python 3.9+** con librerías `pandas` y `openpyxl`: Solo requerido si deseas re-procesar los libros Excel crudos de la ONSV o añadir nuevos corredores viales.

---

## 🚀 Guía Paso a Paso para Iniciar el Proyecto

### Paso 1: Clonar o Descargar el Repositorio
Abre tu terminal o consola de comandos y clona el proyecto en tu máquina local:
```bash
git clone https://github.com/N4kamura/RoadSafetyScan.git
cd RoadSafetyScan
```
*(Si descargaste el código en archivo `.zip`, descomprímelo y abre la terminal dentro de la carpeta del proyecto).*

### Paso 2: Instalar Dependencias de Node
Ejecuta el siguiente comando para instalar todos los paquetes y dependencias requeridas (Vite, MapLibre GL, Vitest, TypeScript):
```bash
npm install
```

### Paso 3: Iniciar el Servidor de Desarrollo Local
Inicia el entorno de desarrollo web con recarga en caliente (Hot Module Replacement):
```bash
npm run dev
```

### Paso 4: Abrir la Aplicación en tu Navegador
Una vez iniciado el servidor, la terminal te indicará la URL local activa. Abre tu navegador web e ingresa a:
```
http://localhost:5173
```
¡Listo! La aplicación cargará automáticamente el mapa cartográfico interactivo, los siniestros de la ONSV, las capas curvilíneas en paralelo a la carretera y el perfil longitudinal inferior.

---

## 🛠️ Comandos Disponibles (NPM Scripts)

El proyecto incluye los siguientes scripts en `package.json`:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con Vite en `http://localhost:5173`. |
| `npm test` | Ejecuta la suite completa de pruebas unitarias e integración con Vitest (24 suites, 90 tests). |
| `npm run test:watch` | Ejecuta las pruebas en modo interactivo con re-ejecución automática ante cambios. |
| `npm run build` | Ejecuta la verificación estricta de tipos de TypeScript (`tsc`) y genera el paquete de producción en la carpeta `dist/`. |
| `npm run preview` | Levanta un servidor local para previsualizar la compilación final generada en `dist/`. |

---

## 🐍 Procesamiento Opcional de Datos con Python

Si descargas nuevas matrices en Excel desde el portal del ONSV del MTC o deseas actualizar la base SQLite3 y los archivos web, puedes ejecutar los scripts automatizados incluidos en `scripts/`:

1. **Re-procesar libros Excel a SQLite3 y JSON Web:**
   ```bash
   python scripts/build_database.py
   ```
   *Lee los Excel en `db/`, normaliza las columnas, calcula georreferenciaciones y genera `db/roadsafety.db` y `public/data/crashes_web.json`.*

2. **Generar archivos GTFS y trazos `.txt`:**
   ```bash
   python scripts/generate_gtfs_and_routes.py
   ```
   *Genera los bundles GTFS (`routes.txt`, `shapes.txt`) y archivos `.txt` en `routes/` y `public/routes/`.*

---

## 🌟 Funcionalidades Destacadas

- **Perfil Curvilíneo Paralelo (*Profiles along a line* - VisQuill A1):** Proyecta la densidad de accidentes o personas como barras ortogonales a lo largo de una línea base desplazada concéntricamente a la carretera.
- **Barras Curvilíneas Apiladas por Gravedad de Personas (SPEC-17):** En la dimensión *Personas*, la barra en el mapa se extruye en capas cromáticas por severidad:
  - 🔴 **Fallecido:** `#DC2626`
  - 🟠 **Lesionado:** `#EA580C`
  - ⚪ **No se conoce:** `#94A3B8`
  - 🟢 **Ileso:** `#10B981`
- **Herramienta Interactiva de Trazo y Exportación GTFS (SPEC-15):** Permite hacer clic sobre el mapa para digitalizar un nuevo eje vial, visualizar su longitud en tiempo real y descargarlo automáticamente en formato `.txt` o estándar **GTFS**.
- **Gestor de Rutas Activas en el Mapa:** Permite activar o desactivar la visibilidad de múltiples rutas simultáneamente y conmutar cuál actúa como eje principal para el análisis LRS.
- **Handle Rectangular de Escala de Altura (SPEC-12):** Botón `[ ≡ ]` arrastrable a lo largo de las barras del mapa para ajustar la escala vertical de visualización de forma táctil e intuitiva.
- **Reloj Dinámico Circular de 24 Horas (SPEC-10):** Permite filtrar interactivamente franjas horarias arrastrando manecillas para evaluar siniestralidad diurna, nocturna o en horas punta.
- **Filtro Temporal por Años (SPEC-13):** Selección múltiple de años de análisis (2021 a 2025) con conteos dinámicos en chips.
- **Exportación Interoperable (SPEC-05):** Descarga inmediata de reportes en:
  - CSV con codificación UTF-8 compatible con Microsoft Excel.
  - GeoJSON de siniestros proyectados con progresivas LRS.
  - GeoJSON de tramos viales (bins) para software SIG (QGIS, ArcGIS).
  - Archivos de eje en formato `.txt`.
  - Paquete de rutas estándar GTFS (`routes.txt`, `shapes.txt`).
- **Diseño Armonizado con Modos Claro y Oscuro (SPEC-16):** Cumplimiento estricto de accesibilidad tipográfica **WCAG AA+** con botón `🌙 / ☀️` en cabecera y persistencia automática.
- **Límites Dinámicos de Zoom y Navegación Libre por el Perú (SPEC-19):** Al seleccionar *"🗺️ Ninguna ruta (Exploración libre)"*, el mapa relaja el límite de alejamiento (`minZoom: 4.0`), permitiendo visualizar el territorio nacional completo de Tumbes a Tacna y navegar libremente hacia cualquier punto del país para auditar siniestros o digitalizar nuevos tramos. Al re-seleccionar una ruta, el mapa vuelve a acotar el zoom (`minZoom: 10.5`) para preservar la nitidez del perfil curvilíneo.

---

## 📁 Estructura del Repositorio

```text
RoadSafetyScan/
├── index.html                  # Punto de entrada HTML y estructura DOM
├── package.json                # Configuración de dependencias y scripts NPM
├── vite.config.ts              # Configuración del empaquetador Vite
├── tsconfig.json               # Configuración del compilador TypeScript
├── constitution.md             # Constitución del Proyecto y principios de gobernanza
│
├── src/
│   ├── main.ts                 # Ensamblaje y ciclo de vida de la aplicación
│   ├── mock-data.ts            # Datos de contingencia y polilíneas de prueba
│   ├── pkg/                    # Módulos centrales de lógica de negocio y algoritmos
│   │   ├── tracer/             # Eje geométrico, cadenamiento, importadores GTFS y .txt
│   │   ├── lrs/                # Motor de proyección ortogonal LRS y agregación de bins
│   │   ├── curvilinear/        # Generador de perfiles paralelos y capas MapLibre
│   │   ├── viz/                # Store reactivo, adaptadores de VisQuill y tipos
│   │   └── export/             # Serializadores a CSV, GeoJSON, TXT y GTFS
│   └── ui/                     # Controladores de interfaz y visualización
│       ├── styles.css          # Sistema de diseño, tokens semánticos y temas
│       ├── theme.ts            # Gestor de temas Claro / Oscuro con localStorage
│       ├── map-view.ts         # Vista cartográfica con MapLibre GL JS
│       ├── profile-view.ts     # Perfilador longitudinal de barras con VisQuill GDK
│       ├── sidebar.ts          # Panel de parámetros, KPIs y filtros temporales
│       ├── time-clock.ts       # Reloj circular dinámico de 24 horas
│       └── trace-drawer.ts     # Herramienta de digitalización interactiva de trazos
│
├── specs/                      # Especificaciones técnicas formales (Spec-Driven Development)
│   ├── README.md               # Índice maestro y ciclo de vida de especificaciones
│   └── *.md                    # Especificaciones SPEC-01 a SPEC-18
├── tasks/                      # Desglose de tareas técnicas vinculadas a cada spec
├── tests/                      # Suite automatizada de pruebas unitarias e integración
│   ├── unit/                   # Pruebas unitarias de algoritmos geométricos y UI
│   └── integration/            # Pruebas integradas de corredores y LRS
│
├── db/                         # Base de datos SQLite3 y libros Excel originales de ONSV
├── routes/                     # Archivos de rutas generados en GTFS y .txt
├── public/                     # Archivos estáticos servidos directamente por Vite
└── scripts/                    # Scripts de procesamiento de datos en Python
```

---

## 📂 Ubicación y Almacenamiento de los Trazos de Rutas

Una duda común es saber dónde se guardan los trazos de carreteras creados y cómo se estructuran:

1. **Trazos Estáticos del Repositorio:**
   - **Directorio de Desarrollo:** [`routes/`](file:///d:/Projects/RoadSafetyScan/routes/)
   - **Directorio Web Público:** [`public/routes/`](file:///d:/Projects/RoadSafetyScan/public/routes/)
   - Contienen la ruta precargada de ejemplo en formato texto (`ruta_ejemplo.txt`) y en estándar GTFS (`routes.txt`, `shapes.txt`, `trips.txt`, `agency.txt` y `manifest.json`).

2. **Trazos Dibujados por el Usuario en la Web (Herramienta *"✏️ Dibujar Trazo"*):**
   - **Persistencia Local Inmediata:** Al digitalizar un trazado sobre el mapa y presionar *"💾 Guardar Trazo"*, la ruta se almacena automáticamente en el `localStorage` del navegador (bajo la clave `roadSafety_custom_routes_v1`). De esta manera, si recargas la página o cierras el navegador, tus trazos digitalizados siguen disponibles.
   - **Descarga de Archivos:** La herramienta cuenta con botones directos para descargar tu nuevo trazo en formato `.txt` o en el paquete estándar **GTFS** (`routes.txt` y `shapes.txt`). Puedes guardar esos archivos descargados directamente dentro de tu carpeta `routes/` para versionarlos en Git.

---

## 🏛️ Metodología: Spec-Driven Development (SDD)

El desarrollo de este software sigue rigurosamente los principios de **Spec-Driven Development (SDD)** establecidos en la [Constitución del Proyecto](file:///d:/Projects/RoadSafetyScan/constitution.md):
1. **Spec-First:** Ninguna funcionalidad se codifica sin contar previamente con su especificación técnica formal aprobada y congelada (`FROZEN`) en [`specs/`](file:///d:/Projects/RoadSafetyScan/specs/).
2. **Trazabilidad Bidireccional:** Cada criterio de aceptación cuenta con pruebas unitarias específicas en `tests/`.
3. **Calidad y Cobertura:** 100% de las pruebas automatizadas (90 tests) deben pasar exitosamente antes de cada entrega o compilación.

---

## ⚖️ Licencia y Atribución

Este proyecto es software libre y de código abierto bajo la licencia **[MIT License](file:///d:/Projects/RoadSafetyScan/LICENSE)**.

- **Objetivo Social y Abierto:** Desarrollado como plataforma de código abierto para empoderar a municipalidades provinciales y distritales, gobiernos regionales, entidades fiscalizadoras (SUTRAN, ATU, PNP Tránsito) y la comunidad académica en la reducción de la siniestralidad vial en el Perú.
- **Atribución de VisQuill GDK:** La visualización del perfil longitudinal y el paradigma de perfil curvilíneo paralelo a lo largo de la calzada están impulsados por **VisQuill GDK** (*Profiles along a line / A1 Collision Density*). Todos los créditos del framework geométrico pertenecen a sus respectivos autores conforme a los términos de atribución de VisQuill GDK.
