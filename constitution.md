# Project Constitution: RoadSafetyScan

## 1. Executive Summary & Vision

**RoadSafetyScan** es una plataforma web analítica de código abierto diseñada para transformar la auditoría y gestión de la seguridad vial en Perú. Su objetivo principal es permitir a ingenieros de transporte, especialistas de entidades públicas (MTC, SUTRAN, ATU, gobiernos regionales y locales) e investigadores realizar un **diagnóstico longitudinal continuo** de la siniestralidad vial a lo largo de cualquier eje o corredor vial definido interactivamente por el usuario.

A partir del dibujo o carga de un alineamiento sobre el mapa, el sistema ejecuta algoritmos de **Referenciación Lineal (LRS - Linear Referencing System)** y filtrado espacial por área de influencia (buffer), generando de forma reactiva un perfil longitudinal de densidad y tipología de accidentes mediante **VisQuill GDK**.

---

## 2. Core Architectural Principles (SDD Directives)

### Principle 1: Spec-First Governance (SDD Compliance)
* Ninguna funcionalidad algorítmica, geométrica o de interfaz se implementará sin un documento de especificación formal previo (`/specs/<feature-name>.md`) que defina:
  * Entradas geométricas y tabulares.
  * Transformaciones matemáticas y tolerancias.
  * Criterios de aceptación comprobables mediante pruebas unitarias.
* El repositorio mantiene una separación estricta entre **Especificación**, **Implementación** y **Verificación**.

### Principle 2: Client-Side Geometry & Local-First Execution
* Para garantizar que cualquier entidad pública pueda usar y desplegar la herramienta sin depender de infraestructura cloud compleja o costosa, el procesamiento geométrico de referenciación lineal se ejecuta en el navegador del cliente.
* El dataset de siniestros viales se sirve en formatos binarios o geoespaciales optimizados para la web (ej. FlatGeobuf, GeoParquet o GeoJSON indexado espacialmente).

### Principle 3: Rigorous Linear Referencing (LRS)
* **Proyección Ortogonal:** Cada siniestro dentro del umbral de tolerancia se proyecta sobre el alineamiento de referencia calculando su distancia de cadenamiento longitudinal ($S_i$) y su desviación lateral u ortogonal ($D_{\perp}$).
* **Filtrado por Buffer Paramétrico:** Solo los eventos donde $\vert{}D_{\perp}\vert{} \le \text{Buffer Threshold}$ ingresan al conjunto de agregación.
* **Segmentación Homogénea:** Los eventos se agregan en intervalos métricos uniformes ($\Delta S$, e.g., 50 m, 100 m, 250 m) para generar histogramas de densidad volumétrica y ponderada.

### Principle 4: Bidirectional Map-Profile Reactivity
* La interacción entre el mapa base espacial y el perfil longitudinal de VisQuill debe ser bidireccional y de baja latencia:
  * Hover / Selección sobre un segmento del histograma $\rightarrow$ Resalta el tramo de vía y los siniestros asociados en el mapa.
  * Hover / Selección sobre un siniestro o tramo en el mapa $\rightarrow$ Resalta la barra o posición correspondiente en el perfil de VisQuill.

### Principle 5: Public Sector Transparency & Open Governance
* El proyecto se publica bajo una licencia de código abierto permisiva (MIT License / Apache 2.0).
* Toda metodología de cálculo, segmentación y ponderación de severidad es auditable y reproducible.
* Se garantiza la exportación de resultados en formatos abiertos estándar (GeoJSON con abscisado y CSV con el perfil tabulado).

---

## 3. System Scope & Functional Modules

### Module 1: Spatial Data Ingestion & Indexing (`pkg/data`)
* **Input Schema:** Dataset de coordenadas $(X, Y)$ / $(\text{lon}, \text{lat})$ en WGS84 con atributos:
  * Severidad (Fatal, Lesiones Graves, Lesiones Leves, Solo Daños).
  * Tipo de Siniestro (Choque, Atropello, Volcadura, Despiste, Caída de pasajero, etc.).
  * Tipo de Vehículo(s) involucrado(s).
  * Fecha / Hora / Condiciones ambientales.
* **Spatial Index:** Indexación en memoria del cliente (e.g., R-Tree / RBush) para permitir consultas espaciales en milisegundos tras el trazo del usuario.

### Module 2: Geometric Trace & Alignment (`pkg/tracer`)
* **Interactive Free-Trace / Multi-Segment Draw:** Captura de trazo interactivo sobre el mapa mediante herramientas vectoriales.
* **External Alignment Load:** Soporte para importar archivos de ejes predefinidos (GeoJSON, KML o GPX).
* **Length & Chainage Calculation:** Cálculo geodésico de distancias acumuladas a lo largo de los vértices del alineamiento.

### Module 3: LRS Projection Engine (`pkg/lrs`)
* Proyección de puntos al segmento de polilínea más cercano.
* Cálculo de:
  * $S_i$: Progresiva métrica lineal desde el inicio del trazo ($km\ 0+000$).
  * $D_{\perp}$: Distancia ortogonal al eje en metros.
* Descarte de incidentes fuera del buffer definido por el usuario.
* Binning / Agrupamiento por tramos métricos homogéneos.

### Module 4: Reactive Visualization & Profiler (`pkg/viz`)
* Integración con **VisQuill GDK** para renderizar el perfil longitudinal de densidad de colisiones.
* Representación estratificada:
  * Densidad total por tramo (Collision Density).
  * Desglose apilado o codificado por color según tipología de siniestro o severidad vial.
* Controles interactivos:
  * Slider de ancho de buffer ($m$).
  * Slider de longitud de intervalo / bin size ($m$).
  * Filtros categóricos por tipo de siniestro y año.

### Module 5: Export & Interoperability (`pkg/export`)
* Descarga de reporte tabular en CSV (Progresiva Inicio, Progresiva Fin, Total Siniestros, Conteo por Severidad/Tipo).
* Descarga del eje segmentado y puntos proyectados en formato GeoJSON.

---

## 5. Technology Stack & Licensing Directives

* **Lenguaje & Core:** TypeScript / Modern JavaScript.
* **Mapa Base & Render:** MapLibre GL JS (con teselas vectoriales OpenFreeMap / Protomaps).
* **Perfil Longitudinal:** VisQuill GDK (con la debida atribución requerida para proyectos open-source).
* **Motor Geoespacial Cliente:** Turf.js / FlatGeobuf / RBush.
* **Testing:** Vitest / Playwright para pruebas unitarias geométricas y de integración.
* **Metodología de Desarrollo:** Spec-Driven Development (SDD).

---

## 6. Definition of Done (DoD) for Specifications

Una especificación se considerará completada e integrada cuando:
1. El documento de especificación en `/specs` esté revisado y congelado.
2. Existan pruebas unitarias automáticas con casos de prueba sintéticos (geometrías rectas, curvas y casos de borde como vértices angostos y puntos equidistantes).
3. Los algoritmos respeten tolerancias geodésicas métricas.
4. No existan dependencias directas a servicios de backend propietarios para el cálculo esencial.