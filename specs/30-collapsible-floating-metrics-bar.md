# SPEC-30: Ocultamiento Colapsable de la Barra Flotante Superior de Métricas y Ajustes Rápidos

- **ID:** SPEC-30
- **Módulo:** `ui` / `styles`
- **Estado:** `IMPLEMENTADO (IMPLEMENTED)`
- **Trazabilidad:** [Constitution - Principle 4 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md#L29-L33)
- **Especificaciones Relacionadas:** [SPEC-16](file:///d:/Projects/RoadSafetyScan/specs/16-ui-polishing-accessibility-and-theme-harmonization.md), [SPEC-29](file:///d:/Projects/RoadSafetyScan/specs/29-collapsible-legend-and-sidebar.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Necesidad del Usuario
En el visor cartográfico principal, la barra flotante superior (`.map-floating-controls`) agrupa controles esenciales de selección rápida de métricas (Siniestros, Vehículos, Personas, EPDO, Densidad), alternancia de lado del perfil curvilíneo (Izquierda / Derecha) y selección rápida de offset métrico (800m, 1200m, 1800m).

Sin embargo, debido a su extensión horizontal (`left: 4rem`, ancho variable entre 550 px y 750 px), en resoluciones compactas, laptops o durante la inspección detallada de tramos viales orientados de norte a sur, esta barra puede superponerse a la geometría del trazo o a las barras 3D extruidas.

El usuario requiere poder:
1. Ocultar o colapsar la barra flotante superior con un solo clic para despejar el tercio superior del lienzo cartográfico.
2. Contar con un botón/píldora compacta persistente que indique el estado o la métrica activa (ej. `📊 Siniestros ▼` o `📊 Controles ▼`) y permita restaurar la barra completa de inmediato con un solo clic.

---

## 2. Requisitos Técnicos y Arquitectura

### 2.1 Requisito 30.1: Estructura Colapsable de la Barra Flotante
- El contenedor `.map-floating-controls` (`#map-floating-controls`) se organiza en:
  - **Cuerpo de controles (`.map-floating-controls-body` / `#map-floating-controls-body`):** Agrupa los tres bloques de pastillas (Métricas, Lado y Separación de Offset).
  - **Botón de alternancia colapsable (`#btn-toggle-floating-controls`):**
    - En estado **desplegado (por defecto)**: Muestra el ícono `▲` (tooltip: "Ocultar controles rápidos").
    - En estado **minimizado/colapsado**: Muestra una píldora compacta con la métrica activa y el chevron hacia abajo (ej. `📊 Siniestros ▼`, `🚗 Vehículos ▼`, `👥 Personas ▼`, `⚖️ EPDO ▼`, `📈 Densidad (/km) ▼`, tooltip: "Mostrar controles rápidos").
- Al hacer clic en el botón de alternancia:
  - Se conmuta la clase CSS `.minimized` sobre `#map-floating-controls`.
  - Cuando está minimizado, `.map-floating-controls-body` se oculta (`display: none !important`), reduciendo el contenedor a una pequeña píldora flotante minimalista.
  - La transición visual de repliegue y despliegue es suave (`transition: padding 0.2s, background-color 0.2s`).

### 2.2 Requisito 30.2: Sincronización de la Métrica Activa en Estado Minimizado
- Al seleccionar una métrica (tanto desde las pastillas del mapa como desde el panel lateral), si la barra está minimizada (o al minimizarse), la etiqueta del botón refleja de forma dinámica la métrica activa actual:
  - `COUNT`: `📊 Siniestros ▼`
  - `VEHICLES`: `🚗 Vehículos ▼`
  - `PERSONS`: `👥 Personas ▼`
  - `EPDO`: `⚖️ EPDO ▼`
  - `DENSITY_KM`: `📈 Densidad (/km) ▼`

---

## 3. Criterios de Aceptación (Test Cases)

- **Test Case 30.1 (Colapso y Expansión de Barra Flotante):**
  Al accionar `#btn-toggle-floating-controls`, el contenedor `#map-floating-controls` conmuta la clase `minimized`.
- **Test Case 30.2 (Ocultamiento del Cuerpo de Pastillas):**
  En estado `minimized`, el contenedor `.map-floating-controls-body` queda oculto del flujo visual.
- **Test Case 30.3 (Alternancia de Ícono y Tooltip del Botón):**
  El botón muestra `▲` en estado expandido y cambia a la etiqueta de métrica con `▼` en estado minimizado.
- **Test Case 30.4 (Sincronización Dinámica con la Métrica Seleccionada):**
  Al cambiar el modo de métrica (ej. a `EPDO` o `VEHICLES`), la etiqueta del botón minimizado se actualiza concordantemente.
