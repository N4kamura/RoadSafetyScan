# SPEC-23: Perfil Curvilíneo Adaptativo al Viewport y Segmentación Métrica Dinámica por Zoom (VisQuill Dynamic Profiling)

- **ID:** SPEC-23
- **Módulo:** `pkg/curvilinear`, `pkg/lrs`, `ui/map-view`
- **Estado:** `APPROVED` (Listo para implementación)
- **Trazabilidad:** [Constitution - Principle 4 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md), [SPEC-06](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md), [SPEC-09](file:///d:/Projects/RoadSafetyScan/specs/09-zoom-limits-and-autoscale.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Limitaciones del Modelo Estático Actual
En la versión preliminar:
1. El perfil curvilíneo se generaba de manera estática e integral para todo el eje vial (desde el $km\ 0$ hasta el $km\ L_{\text{total}}$), sin considerar qué porción de la carretera está realmente encuadrada en la pantalla del usuario.
2. Si el usuario se acerca con el zoom para examinar una intersección o tramo curvo específico, el perfil seguía dibujando barras e isolíneas en zonas que quedaban kilómetros fuera de la vista.
3. El tamaño de segmentación métrica ($\Delta S$) permanecía estático en $100\text{ m}$. Al alejarse con el zoom para ver corredores de $30\text{ km}$ o $50\text{ km}$, miles de barras de $100\text{ m}$ colisionaban visualmente formando una masa apelmazada y difícil de interpretar.

### 1.2 Objetivo del Paradigma Dinámico VisQuill GDK
1. **Recorte Inteligente al Viewport (Viewport-Aware Extent):**
   El perfil curvilíneo (línea base, barras del histograma, isolíneas de escala y rayos conectores) debe **recortarse dinámicamente** para cubrir únicamente la sección del eje vial que se encuentra dentro de la pantalla (área visible del mapa), con un margen de amortiguamiento de $\pm 1$ bin para evitar transiciones bruscas en los bordes.
2. **Segmentación Métrica Dinámica según el Zoom (Zoom-Adaptive Binning):**
   La resolución métrica del perfil debe adaptarse fluidamente a la escala de visualización:
   - Al acercar el zoom, la discretización se afina hasta el límite normativo mínimo estricto de **$100\text{ m}$**.
   - Al alejar el zoom, la discretización métrica aumenta progresivamente ($200\text{ m}, 500\text{ m}, 1000\text{ m}, 2000\text{ m}$) para garantizar barras legibles, estilizadas y representativas del volumen de siniestros.

---

## 2. Modelos Matemáticos y Algorítmicos

### 2.1 Función de Escalamiento de Segmentación por Zoom
La segmentación métrica $\Delta S(z)$ se define como una función escalonada no decreciente del nivel de zoom $z$, con límite inferior estricto de $100\text{ m}$:

$$\Delta S(z) = \begin{cases} 
100\text{ m} & \text{si } z \ge 14.5 \\ 
200\text{ m} & \text{si } 13.5 \le z < 14.5 \\ 
500\text{ m} & \text{si } 12.5 \le z < 13.5 \\ 
1000\text{ m} & \text{si } 11.0 \le z < 12.5 \\ 
2000\text{ m} & \text{si } z < 11.0 
\end{cases}$$

Regla fundamental: $\Delta S(z) \ge 100\text{ m}$ en todo momento.

### 2.2 Algoritmo de Detección de Progresivas Visibles en Pantalla
Dado el bounding box del viewport geográfico $B = [\lambda_{\text{min}}, \phi_{\text{min}}, \lambda_{\text{max}}, \phi_{\text{max}}]$ y el alineamiento $T(s)$:

1. **Evaluación de Vértices y Segmentos:**
   Para cada segmento $AB$ del trazado con progresivas $s_A$ y $s_B$:
   - Si $A \in B$, añadir $s_A$.
   - Si $B \in B$, añadir $s_B$.
   - Si el segmento $AB$ intersecta los bordes del rectángulo $B$, calcular la coordenada de corte y su progresiva interpolada $s_{\text{corte}} = s_A + t \cdot \|AB\|$.
2. **Rango Acotado:**
   - Si no hay intersección ni vértices en pantalla: la carretera está fuera del viewport $\implies$ el perfil no se renderiza.
   - Si existen puntos:
     $$S_{\text{vis\_min}} = \max\left(0,\ \min(\{s_i\}) - \Delta S\right)$$
     $$S_{\text{vis\_max}} = \min\left(L_{\text{total}},\ \max(\{s_i\}) + \Delta S\right)$$
3. El generador curvilíneo recibe el parámetro `visibleRange: [S_vis_min, S_vis_max]` y genera la geometría acotada exclusivamente a dicho intervalo.

---

## 3. Renderizado Reactivo a 60 FPS

- Durante eventos continuos de paneo (`map.on('move')`) y zoom (`map.on('zoom')`), los cálculos de recorte y binning se encolan mediante `requestAnimationFrame` para evitar bloqueos del hilo principal.
- Al culminar el movimiento (`moveend`, `zoomend`), se consolida el estado final en el mapa.

---

## 4. Criterios de Aceptación (DoD)

1. **Segmentación Mínima:** En ningún nivel de zoom la segmentación desciende por debajo de $100\text{ m}$.
2. **Adaptación por Zoom:** Al alejar el zoom de 15 a 11, la segmentación aumenta automáticamente de $100\text{ m}$ a $1000\text{ m}$.
3. **Corte por Pantalla:** Al hacer zoom en un tramo central (ej. km 2 al km 4 de un eje de 20 km), las barras y la línea base del perfil solo se dibujan para el tramo encuadrado en pantalla.
4. **Preservación de Rendimiento:** El recálculo y actualización de capas durante el movimiento no genera caídas de cuadros perceptibles.
5. **Cobertura de Tests:** Pruebas unitarias para la función de binning por zoom y para el cálculo de intersección de progresivas visibles.
