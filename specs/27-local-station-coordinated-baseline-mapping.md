# SPEC-27: Mapeo Local Estacionado y Acotamiento de Desviación de la Proyección (Local Station-Coordinated Baseline Mapping)

## 1. Estado y Metadatos
- **ID:** SPEC-27
- **Título:** Mapeo Local Estacionado y Acotamiento de Desviación de la Proyección
- **Módulo:** `pkg/curvilinear`, `pkg/curvilinear/pointer`, `ui/map-view`
- **Estado:** `APPROVED` / `FROZEN`
- **Referencias:**
  - SPEC-06 (Perfil Curvilíneo Paralelo)
  - SPEC-11 (Puntero Interactivo Bidireccional)
  - SPEC-24 (Mapeo por Longitud de Arco sobre la Línea Base)
  - SPEC-25 (Segmentación Métrica Fija a 100m)
  - SPEC-26 (Constreñimiento 1D del Puntero sobre la Línea Base Offset)

---

## 2. Contexto y Diagnóstico del Problema

El usuario observó un desvío excesivo en la posición del puntero y la línea conectora:
- *"La barrita semicircular que me permite saber en donde está la proyección, no es óptima en el sentido que aunque señala la ubicación de la barra en el recorrido, se desvirtúa demasiado a la proyección literal de la barra al trazo. No debe desviarse demasiado... Ahora cambio de opinión, no está mal pero no debe alejarse tanto a la proyección. Corrige eso."*

### Causa Raíz
En SPEC-24 se aplicó una función de mapeo por **longitud de arco global proporcional**:
$$u(s) = \frac{s - S_{\min}}{S_{\max} - S_{\min}} \cdot L_B$$
En carreteras reales con curvas sucesivas:
- En curvas interiores, la línea base es sustancialmente más corta que la carretera ($\Delta u \ll \Delta s$).
- En curvas exteriores, la línea base es más larga ($\Delta u \gg \Delta s$).
Al aplicar una razón lineal global constante $\frac{s}{L_{\text{road}}}$, las diferencias locales de longitud se acumulaban a lo largo de los kilómetros. Esto provocaba que en sectores intermedios o avanzados, la posición $u(s)$ en la línea base se adelantara o retrasara **cientos de metros o más de 1 km** respecto a la proyección literal de la carretera.
Como resultado:
1. La línea conectora salía en ángulos diagonales pronunciados (30° a 45°) en lugar de conectar transversalmente el tramo correspondiente.
2. Las barras de siniestros quedaban desplazadas longitudinalmente lejos del tramo de carretera donde ocurrieron los hechos.

---

## 3. Fundamentos Matemáticos y Modelo Geométrico

### 3.1 Mapeo Local Estacionado Vértice a Vértice ($s_i \leftrightarrow C_i$)
Durante el muestreo de la carretera se genera una secuencia de progresivas viales monótonas:
$$s_0 = S_{\min} < s_1 < s_2 < \dots < s_M = S_{\max}$$
con paso fino ($\Delta s \le 50\text{ m}$), incluyendo los vértices del eje vial.
Para cada estación $s_i$:
$$P_i = \text{interpolateAtStation}(A, s_i), \quad C_{\text{raw}, i} = \text{offsetCoordinate}(P_i, \vec{n}_{\text{road}}(s_i), D_{\text{offset}})$$
Tras aplicar el desenredo de bucles (*anti-knot*) y el suavizado gaussiano local, se obtiene la polilínea base regularizada:
$$B = [C_0, C_1, C_2, \dots, C_M]$$
donde cada vértice $C_i$ mantiene su **vínculo local determinista** con la progresiva de carretera $s_i$.

### 3.2 Función de Interpolación Local sobre la Línea Base $B(s)$
Para cualquier progresiva vial continua $s \in [S_{\min}, S_{\max}]$:
1. Se localiza el intervalo local $i$ tal que $s \in [s_i, s_{i+1}]$.
2. Se calcula la fracción local:
   $$t = \frac{s - s_i}{s_{i+1} - s_i} \in [0, 1]$$
3. La coordenada sobre la línea base regularizada es:
   $$B(s) = (1 - t) C_i + t C_{i+1}$$
4. El vector normal exterior en $s$ es:
   $$\vec{n}_B(s) = \frac{(1 - t) \vec{n}_{B, i} + t \vec{n}_{B, i+1}}{\|(1 - t) \vec{n}_{B, i} + t \vec{n}_{B, i+1}\|}$$

### 3.3 Acotamiento Estricto de la Desviación ($\le 25\text{ m}$)
Sea $P_{\text{literal}}(s) = \text{offsetCoordinate}(P(s), \vec{n}_{\text{road}}(s), D_{\text{offset}})$ la proyección ortogonal pura no suavizada.
La desviación métrica entre la posición del perfil y la proyección literal satisface:
$$\| B(s) - P_{\text{literal}}(s) \| \le \epsilon_{\text{suavizado}} \le 25.0\text{ metros}$$
independientemente de la longitud total de la carretera (1 km o 500 km). **No existe acumulación de error longitudinal**.

### 3.4 Conectividad Transversal y Posicionamiento de Barras
- **Línea Conectora:** Conecta directamente $P(s)$ en la carretera con $B(s)$ en la línea base. Al estar $B(s)$ directamente enfrente de $P(s)$, la línea conectora es casi ortogonal al corredor ($\text{longitud} \approx D_{\text{offset}}$).
- **Barras de Siniestros (100m):** Para el bin $[s_k, s_{k+1}]$, las bases se sitúan en $[B(s_k), B(s_{k+1})]$, situándose exactamente frente al tramo de 100 metros de carretera donde sucedieron los eventos.
- **Puntero Deslizante 1D:** Al arrastrar el ratón en la coordenada $M$, la proyección ortogonal al segmento más cercano $(C_i, C_{i+1})$ de $B$ obtiene $t \in [0, 1]$. La progresiva vial correspondiente es $s = s_i + t(s_{i+1} - s_i)$, garantizando que el puntero señale en todo momento la carretera justo al frente.

---

## 4. Criterios de Aceptación (Test Cases)

- **Test Case 27.1 (Desviación Acotada respecto a la Proyección Literal):**
  Para cualquier progresiva vial $s$, la distancia entre $B(s)$ y la proyección ortogonal pura $P_{\text{literal}}(s)$ es estrictamente menor a 25 metros.
- **Test Case 27.2 (Ortogonalidad y Longitud de la Línea Conectora):**
  La longitud de la línea conectora entre $P(s)$ y $B(s)$ se encuentra dentro del rango $[D_{\text{offset}} - 30\text{m}, D_{\text{offset}} + 30\text{m}]$, sin diagonales desviadas.
- **Test Case 27.3 (Posición Coherente de Barras frente a Siniestros):**
  Una barra generada para un siniestro en la progresiva $s$ se ubica en la línea base a una distancia lateral de la carretera coherente con el offset, sin desplazamiento acumulativo por curvatura.
- **Test Case 27.4 (Puntero 1D Sincronizado Localmente):**
  Al deslizar el puntero sobre la línea base, la progresiva vial $s$ calculada corresponde al punto de la carretera directamente enfrentado al puntero.

---

## 5. Trazabilidad
- `src/pkg/curvilinear/generator.ts`: Perfil estacionado `stations` en `BaselineArcLengthProfile`, función `sampleBaselineAtStation`.
- `src/pkg/curvilinear/pointer.ts`: Mapeo directo $s \mapsto B(s)$ para puntero y proyección inversa a estación vial.
- `src/ui/map-view.ts`: Integración con MapLibre.
- `tests/unit/curvilinear/local-station-baseline-mapping.test.ts`: Pruebas de desviación acotada y ortogonalidad transversal.
