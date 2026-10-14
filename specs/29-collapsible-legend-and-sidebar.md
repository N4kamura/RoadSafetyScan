# SPEC-29: Ocultamiento Colapsable de Leyenda Cartográfica y Panel Lateral

- **ID:** SPEC-29
- **Módulo:** `ui` / `styles`
- **Estado:** `IMPLEMENTADO (IMPLEMENTED)`
- **Trazabilidad:** [Constitution - Principle 4 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md#L29-L33)
- **Especificaciones Relacionadas:** [SPEC-16](file:///d:/Projects/RoadSafetyScan/specs/16-ui-polishing-accessibility-and-theme-harmonization.md), [SPEC-19](file:///d:/Projects/RoadSafetyScan/specs/19-dynamic-zoom-limits-and-free-peru-navigation.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Necesidad del Usuario
En pantallas medianas, computadoras portátiles o durante presentaciones analíticas de impacto, tanto la leyenda cartográfica flotante (esquina superior derecha) como el panel lateral de parámetros y filtros (350 px a la izquierda) ocupan un espacio visual considerable del lienzo cartográfico, obstruyendo la visualización fluida de los tramos viales y las barras tridimensionales.

El usuario requiere poder:
1. Ocultar o colapsar la leyenda cartográfica flotante con un solo clic para despejar la vista del cuadrante superior derecho.
2. Ocultar o colapsar el panel lateral izquierdo para que el mapa se expanda al 100% del ancho de la pantalla, con botones de fácil acceso para restaurarlo inmediatamente.

---

## 2. Requisitos Técnicos y Arquitectura

### 2.1 Requisito 29.1: Leyenda Cartográfica Colapsable
- La tarjeta flotante `.map-floating-overlay` (`#map-legend-overlay`) se divide en:
  - **Cabecera (`.legend-header`):** Contiene el título `🗺️ Leyenda del Perfilador` y el botón de alternancia (`#btn-legend-collapse`).
  - **Cuerpo (`.legend-body`):** Contiene los elementos descriptivos (Eje, Línea Base, Perfil Curvilíneo, Tramo Resaltado, Gravedad de Personas y Vehículos).
- Al hacer clic en la cabecera o en el botón:
  - Se añade/elimina la clase CSS `.minimized`.
  - Cuando está minimizada, el cuerpo `.legend-body` se oculta (`display: none`), y la tarjeta se reduce a una píldora compacta y elegante de cabecera con el botón `▲`.
  - Al pulsar nuevamente, se restaura completamente mostrando el botón `▼`.
- Cuando la leyenda está minimizada, la función de encuadre `mapController.fitToAlignment()` reduce el margen lateral derecho de 300 px a 80 px, aprovechando todo el ancho de la pantalla.

### 2.2 Requisito 29.2: Panel Lateral Colapsable
- Se incorporan dos controles de alternancia sincronizados:
  1. `#btn-toggle-sidebar` en la barra de navegación superior (`.app-header`).
  2. `#btn-toggle-sidebar-floating` flotante sobre el mapa en el margen izquierdo (`.map-pane`).
- Al accionar cualquiera de los dos botones:
  - Se alterna la clase `.collapsed` sobre `.app-sidebar`.
  - La transición de repliegue/despliegue es suave mediante CSS (`transition: width 0.25s, opacity 0.2s`).
  - En estado colapsado, `.app-sidebar.collapsed` reduce su ancho a `0px`, ocultando su contenido y permitiendo que `.app-content` ocupe el 100% del espacio de trabajo.
  - Los botones alternan sus etiquetas e íconos:
    - Desplegado: `◀ Panel` y `◀` (tooltip: "Ocultar Panel Lateral").
    - Colapsado: `▶ Panel` y `▶` (tooltip: "Mostrar Panel Lateral").
  - Tras la animación de repliegue (260 ms), se invoca `mapController.resize()` para que MapLibre GL recalcule el canvas sin distorsiones geométricas.

---

## 3. Criterios de Aceptación (Test Cases)

- **Test Case 29.1 (Colapso y Expansión de Leyenda):**
  Al accionar el botón de la leyenda, el elemento `#map-legend-overlay` conmuta la clase `minimized`, ocultando el cuerpo `.legend-body`.
- **Test Case 29.2 (Actualización de Ícono de Leyenda):**
  El botón `#btn-legend-collapse` muestra `▼` cuando la leyenda está desplegada y `▲` cuando está colapsada.
- **Test Case 29.3 (Colapso y Expansión del Sidebar):**
  Al pulsar `#btn-toggle-sidebar` o `#btn-toggle-sidebar-floating`, el elemento `.app-sidebar` conmuta la clase `collapsed`, reduciendo su ancho a cero.
- **Test Case 29.4 (Sincronización Dual de Botones de Sidebar):**
  Ambos botones (cabecera y flotante) actualizan simultáneamente sus textos e íconos entre `◀` y `▶` según el estado del panel lateral.
- **Test Case 29.5 (Disparo de Redimensionamiento del Mapa):**
  Al conmutar el estado del sidebar, se ejecuta el método `resize()` del mapa cartográfico para adaptar el lienzo.
