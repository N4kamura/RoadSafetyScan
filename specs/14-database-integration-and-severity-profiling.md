# SPEC-14: Integración de Bases de Datos ONSV (SQLite3/Web), Métrica de Vehículos y Perfilado de Personas por Gravedad

- **ID:** SPEC-14
- **Módulo:** `pkg/data`, `pkg/lrs`, `pkg/curvilinear`, `pkg/viz`, `ui`
- **Estado:** `COMPLETADO (IMPLEMENTED)`
- **Trazabilidad:** [Constitution - Principles 1, 2, 3, 4 & Modules 1, 3, 4](file:///d:/Projects/RoadSafetyScan/constitution.md)
- **Especificaciones Relacionadas:** [SPEC-03](file:///d:/Projects/RoadSafetyScan/specs/03-lrs-projection-engine.md), [SPEC-04](file:///d:/Projects/RoadSafetyScan/specs/04-reactive-visualization-profiler.md), [SPEC-06](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md), [SPEC-13](file:///d:/Projects/RoadSafetyScan/specs/13-annual-temporal-filter.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Contexto de las Fuentes de Datos ONSV
El Observatorio Nacional de Seguridad Vial (ONSV - MTC Perú) registra información en 3 bases de datos tabulares (Excel) con encabezados en la **fila 5**:
1. **BBDD Siniestros Fatales (2021-2025):** 9,106 registros georreferenciados con coordenadas (Latitud y Longitud WGS84) que culminan en la columna `AA` (27 columnas). Posee el identificador clave `CÓDIGO SINIESTRO`.
2. **BBDD Vehículos (2021-2025):** 12,667 registros que vinculan cada vehículo involucrado con un `CÓDIGO SINIESTRO` y `CÓDIGO VEHICULO`.
3. **BBDD Personas (2021-2025):** 25,412 registros que vinculan cada persona con `CÓDIGO SINIESTRO` y `CÓDIGO VEHÍCULO`, detallando la condición de la persona en el atributo fundamental `GRAVEDAD` con cuatro categorías oficiales:
   - **FALLECIDO**
   - **LESIONADO**
   - **NO SE CONOCE**
   - **ILESO**

### 1.2 Requerimiento del Usuario
> *"Ahora vamos a conectar bases de datos y convertirlas a un formato más ligero para lectura web.*
> *Tenemos 3 bases de datos y solo uno tiene coordenadas. Todas tienen su header en la fila 5. Todas las bases de datos están en @db.*
> *1. BBDD Siniestros Fatales. Su header está en la fila 5 y acaba en la columna AA. Esta tiene coordenadas y tiene un código de siniestro.*
> *2. El BBDD Vehiculos, tiene el código de siniestro también e indica la cantidad de vehículos relacionados a ese choque.*
> *3. El BBDD Personas, tiene código de vehículo y siniestro. Permite saber el estado de las personas involucradas.*
> *Necesito bajar de peso a esa base de datos, guardar toda la info, entendería que SQLITE3 es el más liviano. Luego conectarlo a la web. Solo mostrar los accidentes ya que tienen coordenadas y que me salgan los vehículos involucrados (cantidad) y la cantidad de personas involucradas para desagregado según la 'GRAVEDAD' que tiene FALLECIDO, LESIONADO, NO SE CONOCE e ILESO como categorías.*
> *Esto también debe mostrarse en el diagrama de barras, es decir, escoger si muestro solo vehículos, o si muestro las personas afectadas para ver directamente los muertos, lesionados, etc. Acá acepto recomendaciones si se muestran en la propia barra o en otra."*

Decisión de diseño acordada con el usuario:
- **Barra apilada segmentada en la misma barra:** La altura total refleja la cantidad total (personas o vehículos según la dimensión activa) y se subdivide por colores según la gravedad:
  - 🟥 **Fallecido:** `#DC2626`
  - 🟧 **Lesionado:** `#EA580C`
  - 🟨 / ⬜ **No se conoce:** `#94A3B8`
  - 🟩 **Ileso:** `#10B981`
- Se incluye un selector fluido para alternar entre:
  - 📊 **Siniestros** (Accidentes / Conteo de eventos)
  - 🚗 **Vehículos** (Cantidad de vehículos involucrados)
  - 👥 **Personas** (Personas involucradas con desglose apilado de gravedad)
  - ⚖️ **EPDO** (Severidad ponderada MTC)

---

## 2. Requisitos Técnicos y Arquitectura

### 2.1 Requisito 14.1: Persistencia Relacional en SQLite3 y Extracción Web Ligera
- **Script de Ingestión (`scripts/build_database.py`):**
  - Lee los tres archivos Excel saltando metadatos iniciales e interpretando la fila 5 como nombres de columnas.
  - Para Siniestros, procesa desde columna A hasta AA.
  - Crea una base de datos relacional estándar SQLite3 (`db/roadsafety.db`) con 3 tablas completas:
    - `siniestros`: 27 columnas, con índices en `codigo_siniestro`.
    - `vehiculos`: 25 columnas, con índices en `codigo_siniestro` y `codigo_vehiculo`.
    - `personas`: 32 columnas, con índices en `codigo_siniestro`, `codigo_vehiculo` y `gravedad`.
  - Ejecuta un `JOIN` y agregación SQL para calcular por siniestro:
    - Conteo exacto de vehículos involucrados.
    - Conteo exacto de personas y desglose por `fallecido`, `lesionado`, `noSeConoce`, `ileso`.
  - Exporta el dataset web optimizado `public/data/crashes_web.json` (y `db/crashes_web.json`), reduciendo el peso de ~7.5 MB en Excel a ~3.2 MB en JSON estructurado (y ~350 KB comprimido en transferencia web).

### 2.2 Requisito 14.2: Modelo de Datos Extendido (`pkg/lrs` & `pkg/viz`)
- Se extiende `CrashPoint` en `src/pkg/lrs/types.ts`:
  ```typescript
  export interface PersonsBreakdown {
    fallecido: number;
    lesionado: number;
    noSeConoce: number;
    ileso: number;
  }

  export interface CrashPoint {
    id: string | number;
    coordinates: [longitude: number, latitude: number];
    timestamp?: string;
    year?: number;
    severity: SeverityLevel;
    type: CrashType;
    // SPEC-14 Nuevas propiedades consolidadas:
    vehiclesCount?: number;
    personsCount?: number;
    personsBreakdown?: PersonsBreakdown;
    fecha?: string;
    hora?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    roadCode?: string;
    rawProperties?: Record<string, unknown>;
  }
  ```
- Se extiende `LrsBinAggregate`:
  ```typescript
  export interface LrsBinAggregate {
    // ... campos existentes
    totalVehicles: number;
    totalPersons: number;
    personsBreakdown: PersonsBreakdown;
  }
  ```
- Se amplía el tipo `MetricMode` en `src/pkg/viz/types.ts`:
  ```typescript
  export type MetricMode = 'COUNT' | 'VEHICLES' | 'PERSONS' | 'EPDO' | 'DENSITY_KM';
  ```

### 2.3 Requisito 14.3: Agregador LRS Multidimensional (`pkg/lrs/aggregator.ts`)
- `analyzeLrs()` acumula para cada tramo (bin):
  - `totalVehicles = sum(crash.vehiclesCount || 0)`
  - `totalPersons = sum(crash.personsCount || 0)`
  - `personsBreakdown.fallecido = sum(crash.personsBreakdown?.fallecido || 0)`
  - `personsBreakdown.lesionado = sum(crash.personsBreakdown?.lesionado || 0)`
  - `personsBreakdown.noSeConoce = sum(crash.personsBreakdown?.noSeConoce || 0)`
  - `personsBreakdown.ileso = sum(crash.personsBreakdown?.ileso || 0)`

### 2.4 Requisito 14.4: Visualización en el Perfil Curvilíneo ("Profiles along a line")
- En `src/pkg/curvilinear/generator.ts`:
  - `value`:
    - Si `metricMode === 'COUNT'`: `bin.totalCount` (siniestros).
    - Si `metricMode === 'VEHICLES'`: `bin.totalVehicles` (vehículos involucrados).
    - Si `metricMode === 'PERSONS'`: `bin.totalPersons` (personas involucradas).
    - Si `metricMode === 'EPDO'`: `bin.epdoScore`.
    - Si `metricMode === 'DENSITY_KM'`: `bin.densityPerKm`.
  - `CurvilinearBarFeature` almacena `vehiclesCount`, `personsCount` y `personsBreakdown`.
  - La altura de cada barra responde dinámicamente a la métrica seleccionada.

### 2.5 Requisito 14.5: Visualización en el Diagrama de Barras Longitudinal (SVG Profile)
- En `src/ui/profile-view.ts`:
  - En modo `'PERSONS'`: Cada barra se segmenta verticalmente como una **Barra Apilada**:
    - Segmento Inferior: **Fallecido** (`#DC2626`)
    - Segundo Segmento: **Lesionado** (`#EA580C`)
    - Tercer Segmento: **No se conoce** (`#94A3B8`)
    - Segmento Superior: **Ileso** (`#10B981`)
  - En modo `'VEHICLES'`: La barra muestra la cantidad de vehículos en tono azul cielo/turquesa (`#0284C7`).
  - En modo `'COUNT'`: Muestra el conteo de siniestros.
  - El tooltip de inspección desplegable desglosa:
    - Total de siniestros
    - Total de vehículos involucrados
    - Total de personas involucradas y recuento exacto por cada categoría (Fallecido, Lesionado, No se conoce, Ileso).

### 2.6 Requisito 14.6: Popups y Tooltips Cartográficos de Siniestros
- En `src/ui/map-view.ts`:
  - Al posicionar el cursor o hacer clic sobre un siniestro georreferenciado, la tarjeta emergente muestra:
    - 📍 Código de Siniestro
    - 🚗 **Vehículos involucrados:** X vehículos
    - 👥 **Personas involucradas:** Y personas
      - 🔴 Fallecidos: F
      - 🟠 Lesionados: L
      - ⚪ No se conoce: N
      - 🟢 Ilesos: I
    - Ubicación administrativa: Departamento / Provincia / Distrito / Ruta

### 2.7 Requisito 14.7: Carga Automática de Datos Reales en la Web
- En `src/main.ts` y `src/ui/sidebar.ts`:
  - La aplicación intenta cargar automáticamente `/data/crashes_web.json` al inicializarse.
  - Si se encuentra disponible, puebla `VizStore` con los siniestros georreferenciados reales.
  - Se añade un selector de modo de métrica (Pastillas flotantes en mapa y en panel) con opciones:
    - `📊 Siniestros`
    - `🚗 Vehículos`
    - `👥 Personas`
    - `⚖️ EPDO`
  - Se agregan tarjetas KPI en la barra lateral para **Vehículos Involucrados** y **Personas Afectadas**.

---

## 3. Criterios de Aceptación (Definition of Done)

1. **Persistencia SQLite3:** Archivo `db/roadsafety.db` generado con tablas `siniestros`, `vehiculos` y `personas`, verificable mediante consultas SQL.
2. **Dataset Web JSON:** Archivo `public/data/crashes_web.json` generado con 9,105 siniestros georreferenciados consolidados con conteo de vehículos y desglose de personas por gravedad.
3. **Agregación LRS:** El motor computa `totalVehicles`, `totalPersons` y `personsBreakdown` para cada bin longitudinal sin errores métricos.
4. **Reactividad de la Métrica:** Al alternar entre Siniestros, Vehículos y Personas, las barras se recalculan y reescalan instantáneamente tanto en el mapa como en el gráfico longitudinal.
5. **Barra Apilada por Gravedad:** En modo Personas, el gráfico longitudinal muestra barras apiladas con colores diferenciados para Fallecido, Lesionado, No se conoce e Ileso.
6. **Popups Informativos:** La tarjeta emergente de cada siniestro y barra muestra los vehículos y el desglose de personas por gravedad.
7. **Suite de Pruebas:** Pruebas unitarias en Vitest que validen el cálculo de agregados, transformación de datos y renderizado de métricas.
8. **100% Tests Pasando:** `npm test` y `npm run build` ejecutan exitosamente sin regresiones.
