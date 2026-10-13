# SPEC-24: Mapeo por Longitud de Arco sobre la Línea Base y Barras Inalteradas sin Deformación (VisQuill Arc-Length Baseline Mapping & Distortionless Bars)

## 1. Estado y Metadatos
- **ID:** SPEC-24
- **Título:** Mapeo por Longitud de Arco sobre la Línea Base y Barras Inalteradas sin Deformación
- **Módulo:** `pkg/curvilinear`, `ui/map-view`, `pkg/viz`
- **Estado:** `APPROVED` / `FROZEN`
- **Referencias:**
  - Paradigma VisQuill GDK A1 Collision Density: `https://visquill.com/gallery/uk-a1`
  - SPEC-06 (Perfil Curvilíneo Paralelo)
  - SPEC-11 (Puntero Interactivo Bidireccional)
  - SPEC-20 (Anti-Knot & Regularización de Curvatura)
  - SPEC-23 (Recorte al Viewport & Segmentación Dinámica)

---

## 2. Contexto y Diagnóstico del Problema

El análisis visual comparativo con la galería de referencia de **VisQuill (UK A1 Collision Density)** evidenció dos desviaciones geométricas críticas en la implementación previa:

1. **Deformación y Desconexión de Barras en Curvas Cerradas:**
   - En la implementación anterior, las barras poligonales se construían proyectando de forma independiente los vértices viales $P(s_{\text{start}})$ y $P(s_{\text{end}})$ a lo largo de las normales del eje de la carretera ($\vec{n}_{\text{road}}$).
   - Cuando la carretera toma una curva pronunciada, las normales del eje vial convergen o divergen violentamente. Al aplicar el offset (ej. 1,200 m), los rayos se cruzaban, provocando que las bases de las barras se inclinaran, se desconectaran de la línea base suavizada $B$ o se sobrepusieran entre sí formando polígonos invertidos ("nudos").
   - En contraste, la solución de VisQuill **no es una proyección ortogonal punto a punto desde la carretera hacia afuera**, sino un **mapeo por desplazamiento longitudinal relativo (arc-length parameterization)** a lo largo de la línea base continua y suave $B$.

2. **Invasión de Barras en Zonas sin Siniestros (Zero-Value Bar Clutter):**
   - Para cada bin con valor 0 (sin siniestros, personas ni vehículos), el sistema generaba polígonos planos de altura cero (`[P, P, Q, Q, P]`) con relleno tenue (`rgba(...)`) y bordes de línea. Al alejar el zoom o recorrer tramos desiertos, estos polígonos vacíos cubrían kilómetros de carretera, haciendo que las barras parecieran "deformadas" y ocuparan áreas libres.
   - En VisQuill, los tramos con 0 siniestros **no generan ningún polígono de barra**. La línea base $B$ permanece completamente limpia, libre y visible.

3. **Línea Conectora del Puntero por Correspondencia de Progresiva:**
   - La línea que conecta el cursor o puntero negro sobre la línea base con el eje de la carretera une el punto de progresiva vial $P(s)$ con su correspondiente posición de arco $B(u(s))$ en la línea base, manteniendo la coherencia espacial del histograma curvilíneo.

---

## 3. Fundamentos Matemáticos y Modelo Geométrico

### 3.1 Parametrización por Longitud de Arco de la Línea Base ($B$)

Sea $A$ el alineamiento de la carretera con longitud en el rango visible $L_{\text{range}} = S_{\max} - S_{\min}$.
1. Se genera la polilínea base inicial desplazada mediante el offset lateral $D_{\text{offset}}$ y se aplican los algoritmos de desenredo (*anti-knot*) y suavizado gaussiano de SPEC-20, obteniendo la curva regularizada:
   $$B = [C_0, C_1, C_2, \dots, C_M]$$
2. Se calcula la longitud de arco acumulada $u$ a lo largo de $B$:
   $$u_0 = 0, \quad u_j = u_{j-1} + \text{haversine}(C_{j-1}, C_j) \quad (j = 1, \dots, M)$$
   La longitud total de la línea base es $L_B = u_M$.

### 3.2 Función de Correspondencia Vial $\to$ Línea Base $u(s)$

Para cualquier progresiva métrica de carretera $s \in [S_{\min}, S_{\max}]$, se define la tasa de avance normalizada $\tau(s) \in [0, 1]$:
$$\tau(s) = \frac{s - S_{\min}}{S_{\max} - S_{\min}}$$
La posición métrica correspondiente sobre la línea base $B$ se define como:
$$u(s) = \tau(s) \cdot L_B$$

La coordenada geográfica en la línea base $B(u(s))$ se obtiene muestreando directamente los segmentos lineales de la polilínea regularizada $B$.

### 3.3 Normales de la Línea Base $\vec{n}_B(u)$

La extrusión de las barras y de las isolíneas concéntricas de escala se calcula **a lo largo de la normal propia de la línea base regularizada**, $\vec{n}_B$, y **nunca** a lo largo de la normal rugosa de la carretera.

Dado el vector tangente unitario de la línea base en el segmento $j$, $\vec{t}_B = (dx, dy)$:
- Para lado `RIGHT`: $\vec{n}_B = (dy, -dx)$
- Para lado `LEFT`: $\vec{n}_B = (-dy, dx)$

Al ser $B$ una curva sin inflexiones bruscas ni nudos, $\vec{n}_B(u)$ es continua y suave ($C^1$), garantizando que los vectores de extrusión de extremos adyacentes nunca se crucen.

### 3.4 Anclaje Estricto de Barras y Supresión de Cero

Para cada bin analizado $k$ con intervalo de cadenamiento $[s_k, s_{k+1}]$:
1. Si el valor de la métrica activa es cero ($\text{value} = 0$), **no se emite ningún polígono en la colección `bars`**. El espacio queda vacío, revelando la línea base.
2. Si $\text{value} > 0$:
   - Se calculan las posiciones sobre la línea base:
     $$P_{\text{start}} = B(u(s_k)), \quad P_{\text{end}} = B(u(s_{k+1}))$$
     Ambos puntos $P_{\text{start}}$ y $P_{\text{end}}$ yacen **estrictamente sobre la polilínea $B$**.
   - Se calculan las alturas extruidas:
     $$Q_{\text{start}} = \text{offsetCoordinate}(P_{\text{start}}, \vec{n}_B(u(s_k)), h_k)$$
     $$Q_{\text{end}} = \text{offsetCoordinate}(P_{\text{end}}, \vec{n}_B(u(s_{k+1})), h_k)$$
   - El polígono resultante es:
     $$\text{Polygon}_k = [P_{\text{start}}, Q_{\text{start}}, Q_{\text{end}}, P_{\text{end}}, P_{\text{start}}]$$

### 3.5 Puntero y Línea Conectora Progresiva

Para el puntero interactivo en la progresiva $s$:
- Punto en carretera: $P_{\text{road}}(s) = \text{interpolateAtStation}(A, s)$
- Punto en línea base: $P_{\text{baseline}}(s) = B(u(s))$
- Coordenadas de la línea conectora: $[P_{\text{road}}(s), P_{\text{baseline}}(s)]$

---

## 4. Criterios de Aceptación (Test-Driven Criteria)

- **Test Case 24.1 (Anclaje Estricto en Baseline):**
  Todos los vértices inferiores de las barras generadas deben residir sobre la geometría de la polilínea $B$, con desviación métrica menor a $0.05\text{ m}$.
- **Test Case 24.2 (Supresión de Bins Vacíos):**
  Un bin con conteo o valor igual a 0 no debe producir ninguna entidad poligonal en el arreglo `bars` del perfil curvilíneo.
- **Test Case 24.3 (Correspondencia por Longitud de Arco):**
  El avance relativo a lo largo de la línea base $\Delta u / L_B$ debe ser exactamente proporcional al avance relativo a lo largo del eje vial $\Delta s / L_{\text{range}}$.
- **Test Case 24.4 (Estabilidad Angular en Curvas):**
  En una curva con radio cerrado ($R < D_{\text{offset}}$), las caras laterales de las barras no se invierten ni se cruzan ($Q_{\text{start}}$ y $Q_{\text{end}}$ mantienen el orden secuencial de la línea base).
- **Test Case 24.5 (Línea Conectora de Puntero):**
  La línea conectora une el punto de la carretera $P(s)$ con el punto de la línea base $B(u(s))$.

---

## 5. Implementación y Trazabilidad

| Módulo / Archivo | Función / Responsabilidad |
| :--- | :--- |
| `src/pkg/curvilinear/generator.ts` | Parametrización $u(s)$, interpolación sobre $B$, extrusión con $\vec{n}_B$, supresión de valores cero. |
| `src/pkg/curvilinear/pointer.ts` | Posicionamiento del puntero y línea conectora usando $B(u(s))$. |
| `src/pkg/curvilinear/viewport.ts` | Segmentación mínima $\ge 100\text{ m}$ y escalado visual suave. |
| `tests/unit/curvilinear/visquill-baseline-mapping.test.ts` | Batería de pruebas unitarias para SPEC-24. |
