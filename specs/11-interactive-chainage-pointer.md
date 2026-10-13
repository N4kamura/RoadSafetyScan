# SPEC-11: Botón Semicircular Desplazable y Línea Conectora de Proyección Vial

- **ID:** SPEC-11
- **Módulo:** `pkg/curvilinear` & `ui/map-view`
- **Estado:** `COMPLETADO (IMPLEMENTED)`
- **Trazabilidad:** [Constitution - Principle 4 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md#L29-L33)
- **Especificaciones Relacionadas:** [SPEC-06](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md), [SPEC-07](file:///d:/Projects/RoadSafetyScan/specs/07-map-layer-rendering-diagnostics.md), [SPEC-12](file:///d:/Projects/RoadSafetyScan/specs/12-interactive-scale-handle.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Necesidad del Usuario
En el perfil longitudinal curvilíneo proyectado en paralelo al eje ("Profiles along a line"), existe una separación física ($D_{\text{offset}}$ de 800 a 2500 metros) entre la carretera y las barras del histograma. Al inspeccionar un pico de concentración de siniestros en las barras, el usuario necesita correlacionar de forma visual e instantánea el punto exacto de la gráfica con su correspondiente progresiva sobre la calzada vial.

El usuario requiere que:
> *"En la gráfica de barras habrán dos botones móviles por así decirlo, uno que este en la parte inferior de las barras, justo debajo. Si yo hago click, aparecerá automáticamente una línea que me indique la ubicación exacta en el trazo de la posición de la gráfica que yo estoy digamos apuntando con dicho botón. En la segunda imagen verás una línea negra que sale de la gráfica de barras y va directamente al trazo. Eso lo he hecho yo haciendo click en el botón semicircular negro que está debajo de la gráficas de barra. Ese botón es desplazable."*

---

## 2. Requisitos Técnicos y Criterios de Aceptación

### 2.1 Requisito 11.1: Botón Semicircular en la Línea Base ($B(s)$)
- Se posiciona un botón interactivo sobre la línea base desplazada $B(s)$, en la base inferior de las barras.
- Forma y apariencia visual idéntica a la imagen de referencia:
  - Semicírculo negro (`#0F172A`) orientado con su domo circular hacia la carretera y su lado plano hacia la base de las barras.
  - Dos ranuras blancas paralelas de agarre (`||` o `=`) en el centro.
  - Sombra suave y cursor tipo `grab`/`pointer`.
- El botón posee un estado de progresiva longitudinal $s \in [0, \text{totalLength}]$.
- Inicialmente se posiciona en el punto medio del corredor o en el tramo crítico (hotspot máximo).

### 2.2 Requisito 11.2: Línea Conectora Ortogonal hacia el Trazo Vial
- Al hacer clic sobre el botón semicircular, se alterna la visibilidad de una línea conectora recta negra (`line-color: #0F172A`, `line-width: 3.5px`).
- La línea une de forma continua y exacta:
  - Extremo A: La posición del botón en la línea base $B(s)$.
  - Extremo B: El punto correspondiente $P(s)$ sobre el eje vial de la carretera.
- La línea es ortogonal al trazo vial, siguiendo el vector normal interpolado $\vec{n}(s)$.

### 2.3 Requisito 11.3: Desplazamiento Interactivo a lo Largo del Corredor
- El botón semicircular es interactivo y arrastrable (*draggable*) a lo largo de toda la longitud del corredor vial.
- Durante el arrastre:
  - Se proyecta la posición del cursor para determinar el nuevo valor de cadenamiento $s$.
  - Se actualizan en tiempo real las coordenadas del botón en $B(s)$.
  - Si la línea conectora está visible, sus extremos se actualizan instantáneamente entre $P(s)$ y $B(s)$.
  - Se actualiza la selección/hover en `VizStore` para resaltar el tramo y la progresiva correspondiente (`formatStation(s)`).

### 2.4 Requisito 11.4: Criterios de Aceptación (DoD)
1. Tests unitarios en `tests/unit/curvilinear/pointer.test.ts` verifican:
   - Interpolación de coordenadas de enlace $P(s)$ y $B(s)$ para progresivas arbitrarias.
   - Cálculo de vector de enlace ortogonal y distancia coincidente con $D_{\text{offset}}$.
2. En la interfaz web, el botón semicircular es visible en la base de las barras y al hacer clic despliega la línea negra continua hacia la carretera.
3. El botón puede ser arrastrado libremente a lo largo del trazo.
4. 100% de tests pasando en `npm test`.
