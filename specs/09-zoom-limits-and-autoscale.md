# SPEC-09: Límite de Zoom y Auto-Escalado Dinámico del Perfil al Alejar el Mapa

- **ID:** SPEC-09
- **Módulo:** `pkg/curvilinear` & `ui/map-view`
- **Estado:** `COMPLETADO (IMPLEMENTED)`
- **Trazabilidad:** [Constitution - Principle 4 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md#L29-L33)
- **Especificaciones Relacionadas:** [SPEC-06](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md), [SPEC-07](file:///d:/Projects/RoadSafetyScan/specs/07-map-layer-rendering-diagnostics.md), [SPEC-08](file:///d:/Projects/RoadSafetyScan/specs/08-crash-points-zoom-visibility.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Necesidad del Usuario
Al navegar en la plataforma cartográfica:
1. Si el usuario aleja el zoom indefinidamente hacia escalas continentales o globales, el corredor vial de interés se reduce a un punto indiscernible, perdiendo utilidad operativa. Se requiere fijar un **límite máximo de alejamiento** (`minZoom`) más allá del cual el mapa no permita alejarse más.
2. Al estar expresado el histograma curvilíneo en metros geográficos sobre el terreno ($H = \text{valor} \times \text{escala}$), al alejar el zoom la resolución de pantalla disminuye exponencialmente (más metros por píxel). Como consecuencia, las barras del histograma se comprimen visualmente en la pantalla hasta parecer líneas casi invisibles.
   El usuario requiere que:
   > *"La gráfica de barras debe escalarse automáticamente cuando alejo el zoom. El zoom tendría un límite máximo y no podría alejarme más."*

---

## 2. Requisitos Técnicos y Criterios de Aceptación

### 2.1 Requisito 9.1: Límite Máximo de Alejamiento Cartográfico (`minZoom`)
- En la inicialización de MapLibre GL JS en `MapViewController`, establecer `minZoom: 10.5` (límite máximo de alejamiento para preservar el contexto de la región metropolitana y del corredor vial sin desorientar al usuario).
- Ningún gesto de scroll, doble clic o botón de navegación podrá alejar el mapa por debajo de este límite `minZoom`.

### 2.2 Requisito 9.2: Función de Auto-Escalado Dinámico por Zoom (`computeZoomAdjustedScale`)
- Implementar en `src/pkg/curvilinear/generator.ts` una función matemática determinista que calcule el factor de escala dinámico en función del zoom actual $z$:
  $$\text{factor}(z) = \begin{cases} 1.0 & \text{si } z \ge z_{\text{ref}} \\ 2^{(z_{\text{ref}} - z) \times \gamma} & \text{si } z < z_{\text{ref}} \end{cases}$$
  donde $z_{\text{ref}} = 13.0$ (zoom base de visualización del corredor), $\gamma = 0.70$ (coeficiente de amortiguación para evitar crecimiento desmedido), y acotado superiormente por un límite de seguridad:
  $$\text{factor}(z) \le 4.5$$
- La escala efectiva de extrusión utilizada para generar el perfil curvilíneo será:
  $$S_{\text{eff}} = S_{\text{base}} \times \text{factor}(z)$$
- Al acercar el zoom nuevamente ($z \ge 13.0$), el factor regresa a $1.0$, recuperando la escala base configurada por el usuario.

### 2.3 Requisito 9.3: Reactividad en el Controlador de Mapa (`MapViewController`)
- Suscribir un handler al evento `zoom` o `zoomend` del mapa.
- Cuando el zoom varíe significativamente ($|\Delta z| \ge 0.15$), recalcular y actualizar las fuentes GeoJSON del perfil curvilíneo (`source-curvilinear-bars`, `source-curvilinear-isolines`, `source-curvilinear-connectors`, `source-curvilinear-labels`) aplicando la escala ajustada sin bloquear el hilo principal.

### 2.4 Requisito 9.4: Criterios de Aceptación (DoD)
1. Tests unitarios en `tests/unit/curvilinear/curvilinear.test.ts` verifican:
   - Que para $z \ge 13.0$, el factor es $1.0$.
   - Que para $z = 11.0$, el factor se escala de forma monótona creciente y acotada ($\le 4.5$).
   - Que para $z = 10.5$ (límite inferior), el factor se mantiene en el rango admisible.
2. La instancia del mapa tiene configurado `minZoom: 10.5`.
3. 100% de tests pasando en `npm test`.
