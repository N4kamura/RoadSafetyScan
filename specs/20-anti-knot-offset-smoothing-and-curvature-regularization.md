# SPEC-20: Suavizado Geométrico Avanzado de Curvas Cerradas y Prevención de Bucles/Nudos en Perfiles Curvilíneos (Anti-Knot Offset Smoothing)

- **ID:** SPEC-20
- **Módulo:** `pkg/curvilinear`
- **Estado:** `APPROVED` (Listo para implementación)
- **Trazabilidad:** [Constitution - Principle 4 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md), [SPEC-06](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md)

---

## 1. Declaración del Problema y Justificación Geométrica

### 1.1 El Fenómeno del "Nudo" o Singularidad de Evoluta (Swallowtail Loop)
Al generar una línea base desplazada $B(s)$ a una distancia lateral $D_{\text{offset}}$ de un eje vial $T(s)$:
$$B(s) = T(s) + D_{\text{offset}} \cdot \vec{n}(s)$$

Cuando el trazado vial describe una curva cerrada o un quiebre angular hacia el lado del offset (lado cóncavo) con un radio de curvatura $R(s) < D_{\text{offset}}$, los vectores normales $\vec{n}(s)$ convergen y se intersectan antes de alcanzar la distancia del offset. 

Como consecuencia directa:
1. La secuencia longitudinal de puntos desplazados $\{B(s_k)\}$ se invierte localmente en el espacio ($B(s_{k+1})$ queda situado por detrás de $B(s_k)$ respecto a la dirección de avance).
2. La línea base y las isolíneas de escala se auto-cruzan formando un bucle cerrado en forma de "lazo" o "corbatín" (self-intersecting bowtie loop / nudo).
3. Este bucle degenera la lectura visual del histograma, superpone barras de diferentes progresivas y rompe la continuidad visual del corredor.

### 1.2 Objetivo
Implementar un doble mecanismo geométrico de regularización:
1. **Suavizado Geodésico Ponderado Multiescala de Normales:** Incrementar la ventana de suavizado espacial y aplicar ponderación gaussiana a lo largo del eje.
2. **Algoritmo de Detección y Desenredo de Bucles (Anti-Knot Untangling):** Identificar cualquier par de segmentos que se auto-intersecten en la polilínea desplazada ($P_i P_{i+1} \cap P_j P_{j+1}$) y eliminar el bucle redundante interno reemplazándolo por el vértice de empalme o arco de curvatura continua.
3. **Filtro de Suavizado Laplaciano Post-Desplazamiento:** Redondear y armonizar los vértices resultantes de la baseline y las isolíneas sin alterar los extremos anclados ($km\ 0$ y $km\ \text{final}$).

---

## 2. Formulación Matemática del Algoritmo Anti-Knot

### 2.1 Detección de Auto-Intersección de Segmentos
Dada la polilínea de coordenadas desplazadas $\{P_0, P_1, \dots, P_N\}$:
Para cada segmento $S_a = [P_i, P_{i+1}]$ y cada segmento no adyacente $S_b = [P_j, P_{j+1}]$ (con $j > i + 1$):

Se evalúa la existencia de un punto de intersección $Q = (X_Q, Y_Q)$:
$$P_i + u \cdot (P_{i+1} - P_i) = P_j + v \cdot (P_{j+1} - P_j), \quad u \in [0, 1], v \in [0, 1]$$

### 2.2 Poda del Bucle Interno (Loop Trimming)
Si se detecta una intersección válida entre $S_a$ y $S_b$:
1. Los puntos intermedios $\{P_{i+1}, P_{i+2}, \dots, P_j\}$ pertenecen al bucle interno de inversión cóncava.
2. Se reemplaza la subsecuencia $[P_i, P_{i+1}, \dots, P_{j+1}]$ por $[P_i, Q, P_{j+1}]$.
3. El proceso se reitera de forma iterativa hasta que la polilínea no presente auto-intersecciones residuales.

### 2.3 Suavizado Espacial Gaussiano Post-Offset
Para cualquier polilínea $\{P_k\}_{k=0}^M$:
$$P'_k = \frac{\sum_{m=-w}^w G(m) \cdot P_{k+m}}{\sum_{m=-w}^w G(m)}, \quad k \in (0, M)$$
con $G(m) = \exp\left(-\frac{m^2}{2\sigma^2}\right)$, manteniendo fijos los extremos $P'_0 = P_0$ y $P'_M = P_M$.

---

## 3. Criterios de Aceptación (DoD)

1. En curvas con giros cerrados (de $45^\circ$ a $120^\circ$) y offsets entre $200\text{ m}$ y $2000\text{ m}$, la baseline no debe generar lazos cruzados ("X").
2. Las isolíneas de escala deben heredar la misma geometría continua y sin nudos.
3. El tiempo de cómputo para desenredar y suavizar una polilínea de 500 muestras debe ser $\le 15\text{ ms}$.
4. 100% de tests unitarios verificando la eliminación de lazos y la preservación de anclajes terminales.
