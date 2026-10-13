# SPEC-08: Visibilidad de Puntos de Accidentes según Zoom

- **ID:** SPEC-08
- **Módulo:** `pkg/viz` & `ui/map-view`
- **Estado:** `COMPLETADO (IMPLEMENTED)`
- **Trazabilidad:** [Constitution - Principle 4 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md#L29-L33)
- **Especificaciones Relacionadas:** [SPEC-04](file:///d:/Projects/RoadSafetyScan/specs/04-reactive-visualization-profiler.md), [SPEC-07](file:///d:/Projects/RoadSafetyScan/specs/07-map-layer-rendering-diagnostics.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Necesidad del Usuario
A escalas cartográficas amplias (zoom bajo o moderado, ej. cuando se visualiza el corredor completo de 7 a 40 km), renderizar simultáneamente decenas o cientos de puntos circulares individuales de siniestros genera congestión y solapamiento visual (*cluttering*). Esto resta protagonismo al eje vial y al perfil de densidad longitudinal ("Profiles along a line").

El usuario requiere que:
> *"Los puntos de accidentes solo se deben ver cuando uno acerca el zoom nada más."*

### 1.2 Comportamiento Esperado
1. Cuando el mapa está alejado (vista panorámica o vista global del corredor, zoom < umbral), los puntos individuales de accidentes **no se muestran** (`layer-crashes-points` oculta). El usuario aprecia con total claridad el trazado de la carretera, la línea base y las barras de densidad de accidentes.
2. Cuando el usuario realiza acercamiento (*zoom in*) hacia un tramo o punto crítico de interés (zoom >= umbral, ej. `13.5`), los puntos individuales de accidentes aparecen nítidamente sobre la faja vial con su correspondiente simbología por severidad, permitiendo inspección de detalle y hover interactivo.

---

## 2. Requisitos Técnicos y Criterios de Aceptación

### 2.1 Requisito 8.1: Configuración de Umbral `minzoom` en Capa de Siniestros
- En la función `buildMapLibreConfig` (`src/pkg/viz/maplibre-adapter.ts`), la capa `layer-crashes-points` debe definir la propiedad `minzoom: 13.5`.
- Se permite parametrizar este valor en `options.crashPointsMinZoom` con un valor por defecto de `13.5`.

### 2.2 Requisito 8.2: Integridad de Interacciones y Datos
- El filtrado por zoom es nativo de la capa de renderizado de MapLibre GL JS, por lo que no altera el cálculo de los bins agregados en el motor LRS ni la generación de las barras del perfil curvilíneo.
- Cuando el zoom del mapa es menor al umbral (`< 13.5`), los eventos de hover/click en puntos no deben interferir con la navegación ni mostrar popups espurios.
- La leyenda cartográfica flotante debe indicar con claridad que los puntos individuales de siniestros son visibles al acercar el zoom.

### 2.3 Requisito 8.3: Criterios de Aceptación (DoD)
1. Tests unitarios en `tests/unit/viz/maplibre-render.test.ts` verifican que la capa `layer-crashes-points` incluye `minzoom: 13.5`.
2. Al ejecutar la suite de pruebas (`npm test`), el 100% de los tests pasan exitosamente.
3. La interfaz web oculta los círculos de accidentes en la vista global y los muestra al acercar el zoom.
