# SPEC-28: Grilla Cuádruple Fija y Botón de Escala Confinado a la Grilla

- **ID:** SPEC-28
- **Módulo:** `pkg/curvilinear` & `ui/map-view`
- **Estado:** `COMPLETADO (IMPLEMENTED)`
- **Trazabilidad:** [Constitution - Principle 4 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md#L29-L33)
- **Especificaciones Relacionadas:** [SPEC-06](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md), [SPEC-11](file:///d:/Projects/RoadSafetyScan/specs/11-interactive-chainage-pointer.md), [SPEC-12](file:///d:/Projects/RoadSafetyScan/specs/12-interactive-scale-handle.md), [SPEC-24](file:///d:/Projects/RoadSafetyScan/specs/24-visquill-arc-length-baseline-mapping-and-distortionless-bars.md), [SPEC-26](file:///d:/Projects/RoadSafetyScan/specs/26-1d-baseline-constrained-pointer-slider.md), [SPEC-27](file:///d:/Projects/RoadSafetyScan/specs/27-local-station-coordinated-baseline-mapping.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Contexto y Deficiencias Detectadas
En versiones previas del perfil curvilíneo ("Profiles along a line"):
1. **Número variable de isolíneas:** La grilla concéntrica generaba un número impredecible de niveles (a veces 2, 3 o más de 5 isolíneas dependiendo del valor máximo y el paso dinámico), rompiendo la coherencia visual con el modelo de referencia VisQuill GDK (donde la grilla posee una estructura constante de 4 escalas concéntricas).
2. **Desplazamiento 2D libre del botón de escala:** Durante el arrastre con el ratón (`drag`), el marcador rectangular de escala en MapLibre se movía bidimensionalmente por cualquier parte de la pantalla, perdiendo el contacto con el rayo transversal de la grilla.
3. **Desconexión con los niveles de la grilla:** El botón de escala se posicionaba en una distancia arbitraria (`scale * 4.0`), en lugar de coincidir exactamente con el **primer nivel de la grilla (más abajo)** por defecto.
4. **Persistencia de nivel al manipular:** El usuario necesita que el botón rectangular se desplace **únicamente por el rayo transversal de la grilla**, comenzando por defecto en el nivel 1 (más abajo), y que al ser arrastrado a otro nivel (nivel 1, 2, 3, 4) o entre escalas (niveles continuos intermedios como 1.5, 2.3), se quede allí fijado y modifique proporcionalmente la escala visual de las barras.

---

## 2. Definición Geométrica y Matemática

### 2.1 Estructura Estricta de 4 Escalas Concéntricas
La grilla curvilínea cuenta siempre y sin excepción con exactamente **4 niveles de escala concéntricos**:
$$T = [T_1, T_2, T_3, T_4] = [S, 2S, 3S, 4S]$$
donde $S$ es el paso regular calculado a partir del valor máximo $V_{\text{max}}$ de los bins analizados:
- Si $V_{\text{max}} \le 0$: $S = 10 \implies T = [10, 20, 30, 40]$.
- Si $V_{\text{max}} > 0$: se calcula el paso legible estándar $S$ tal que $4 \cdot S \ge V_{\text{max}}$.
Cada isolínea $k \in \{1, 2, 3, 4\}$ se proyecta a una distancia ortogonal desde la línea base:
$$d_k = T_k \times \text{heightScaleMetersPerUnit} = k \cdot (S \times \text{heightScaleMetersPerUnit})$$

### 2.2 Rayo Transversal de la Grilla y Confinamiento 1D
En la progresiva actual del puntero $s$, el rayo transversal de la grilla está definido por el segmento de origen $B(s)$ (sobre la línea base) orientado en la dirección del vector normal exterior $\vec{n}(s)$.
Durante el arrastre del cursor con coordenada geográfica $C = (\text{lon}, \text{lat})$, la distancia escalar proyectada sobre la normal es:
$$d_{\text{proj}} = (C - B(s)) \cdot \vec{n}(s)$$
Esta distancia se acota estrictamente dentro de la extensión de la grilla:
$$d_{\text{clamped}} = \max(d_{\text{min}}, \min(d_{\text{max}}, d_{\text{proj}}))$$
donde $d_{\text{min}} = 0.25 \cdot d_1$ y $d_{\text{max}} = d_4 = 4.0 \cdot d_1$.
La coordenada del botón rectangular en el mapa se fuerza en cada frame de arrastre a:
$$P_{\text{handle}} = \text{offsetCoordinate}(B(s), \vec{n}(s), d_{\text{clamped}})$$
garantizando que el botón **nunca abandone el rayo transversal de la grilla**.

### 2.3 Nivel de Grilla y Manipulación de Escala
Se define el nivel de grilla continuo del botón como:
$$\lambda = \frac{d_{\text{clamped}}}{d_1} \in [0.25, 4.0]$$
- **Valor por defecto:** $\lambda = 1.0$ (situado exactamente sobre el primer nivel de la grilla, más abajo: $d = d_1$).
- **Niveles enteros de escala:**
  - $\lambda = 1.0$: Nivel 1 (escala base $S_{\text{base}} = 40\text{ m/u}$).
  - $\lambda = 2.0$: Nivel 2 (escala $80\text{ m/u}$).
  - $\lambda = 3.0$: Nivel 3 (escala $120\text{ m/u}$).
  - $\lambda = 4.0$: Nivel 4 (escala máxima).
- **Posición entre escalas:** Cualquier valor continuo (ej. $\lambda = 1.5, 2.3$). Al soltar el arrastre, el botón **se queda allí** en ese nivel exacto $\lambda$, actualizando la escala de extrusión de las barras:
  $$S(\lambda) = \text{clamp}(10, 120, \text{round}(S_{\text{base}} \cdot \lambda))$$

---

## 3. Criterios de Aceptación (Test Cases)

- **Test Case 28.1 (Grilla Siempre con 4 Escalas Concéntricas):**
  La función `generateCurvilinearProfile` genera exactamente 4 isolíneas concéntricas para cualquier conjunto de datos (con o sin siniestros), con valores monótonos múltiplos exactos $[S, 2S, 3S, 4S]$.
- **Test Case 28.2 (Posición por Defecto en el Nivel 1 de la Grilla):**
  Al inicializar el botón rectangular con $\lambda = 1.0$, su coordenada coincide exactamente con la primera isolínea (nivel 1, más abajo) a lo largo del rayo normal.
- **Test Case 28.3 (Confinamiento 1D Estricto al Rayo Transversal):**
  Cualquier cursor arrastrado fuera del eje transversal es proyectado ortogonalmente sobre el segmento normal de la grilla, sin desplazamiento lateral.
- **Test Case 28.4 (Estabilidad entre Escalas y en Escalas Específicas):**
  El botón puede ubicarse exactamente en el Nivel 1, Nivel 2, Nivel 3, Nivel 4, o en valores continuos entre escalas ($\lambda = 1.5$), manteniéndose fijado en dicha posición relativa tras el arrastre.
- **Test Case 28.5 (Manipulación Reactiva de la Altura de Barras):**
  Al desplazar el botón hacia niveles superiores ($\lambda > 1$), la escala métrica de extrusión de las barras aumenta correspondientemente, sincronizándose con el store y el control de la barra lateral.
