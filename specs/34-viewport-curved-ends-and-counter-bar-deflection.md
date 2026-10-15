# SPEC-34: Bordes Curvos Invariables hacia el Lado Opuesto de las Barras en Cualquier Zoom (VisQuill Counter-Bar End Curvature at Every Zoom)

## 1. Estado y Metadatos
- **ID:** SPEC-34
- **Título:** Bordes Curvos Invariables hacia el Lado Opuesto de las Barras en Cualquier Nivel de Zoom
- **Módulo:** `pkg/curvilinear`, `pkg/curvilinear/generator`, `ui/map-view`
- **Estado:** `IMPLEMENTED` (100% Tests Pass)
- **Referencias Visuales:**
  - Evidencia VisQuill A1 Corridor (Zoom medio y curvatura terminal en contra de las barras): `C:/Users/W11/.gemini/antigravity/brain/36bd6bb5-e6ba-4b2f-80dd-f10da79c3b09/.user_uploaded/media_1792021610862_c7ef0c05.png`
  - Evidencia VisQuill UK A1 Corridor (Borde curvado hacia la carretera): https://visquill.com/gallery/uk-a1
- **Especificaciones Relacionadas:**
  - SPEC-31 (Línea Base Rectilínea & Barras Ortogonales Limpias)
  - SPEC-32 (Línea Base Estable con Bordes Curvos)
  - SPEC-33 (Alineación de Controles Duales & Seguimiento a la Mira)

---

## 2. Contexto y Diagnóstico del Problema

### 2.1 Diagnóstico de Inconsistencias en SPEC-32
En la implementación inicial de SPEC-32, se presentaron tres anomalías críticas frente al comportamiento visual real de VisQuill (documentado en `https://visquill.com/gallery/uk-a1` y en `media_1792021610862_c7ef0c05.png`):

1. **Curvatura limitada exclusivamente a los extremos absolutos de la carretera:**
   - La parametrización dependía de $\tau = s / L_{\text{total}}$. En cualquier acercamiento o nivel de zoom intermedio (ej. inspección de un tramo de 10 km en una carretera de 650 km), $\tau \in [0.2, 0.3]$, por lo que la línea base no presentaba ninguna curva en los bordes visibles de la pantalla.
   - En VisQuill, **en cualquier nivel de zoom** (sea vista general o acercamiento local), los extremos visibles del perfil en el viewport **siempre** se curvan de manera consistente.

2. **Dirección errónea de las curvas (giro hacia arriba / hacia las barras):**
   - Al interpolar con la normal del eje vial local en los extremos ($w \cdot \vec{n}_{\text{road}}$), si la carretera real tenía un giro local o curva cerrada, el extremo de la línea base se retorcía hacia arriba o hacia adentro de las barras.
   - El estándar geométrico de VisQuill exige que las curvas terminales siempre se flexionen **en contra de las barras** (hacia la carretera / hacia abajo / lado opuesto a la extrusión de las barras), creando un remate cóncavo y orgánico que envuelve el corredor visual.

3. **Desplazamiento excesivo del botón semicircular de proyección:**
   - Al basar la secante central en los extremos globales $[0, L_{\text{total}}]$, si el trazado vial tenía inflexiones amplias a nivel macro, la línea base en tramos intermedios quedaba desfasada a kilómetros de distancia de la carretera, alejando artificialmente el puntero semicircular y su línea conectora.

---

## 3. Fundamentos Matemáticos y Modelo Geométrico

### 3.1 Normalización Relativa al Segmento Visible del Viewport
Sea $[s_{\min}, s_{\max}]$ el rango de progresivas visibles en el viewport actual, con longitud visible $L_{\text{view}} = s_{\max} - s_{\min}$.

Para cada progresiva muestreada $s \in [s_{\min}, s_{\max}]$, su posición relativa normalizada es:
$$\tau(s) = \frac{s - s_{\min}}{L_{\text{view}}} \in [0, 1]$$

### 3.2 Vector Director y Normal Outward del Tramo Visible
A partir de las coordenadas interpoladas en los extremos del tramo visible $P(s_{\min})$ y $P(s_{\max})$:
$$\vec{V} = P(s_{\max}) - P(s_{\min}), \quad \vec{T} = \frac{\vec{V}}{\|\vec{V}\|}$$
La normal unitaria de extrusión $\vec{N}_{\text{out}}$ orientada hacia el lado configurado (`RIGHT` o `LEFT`) es:
$$\vec{N}_{\text{out}} = \begin{cases} (T_y, -T_x) & \text{si side = 'RIGHT'} \\ (-T_y, T_x) & \text{si side = 'LEFT'} \end{cases}$$

### 3.3 Función de Ponderación y Flexión Terminal Cóncava (Anti-Barras)
Sea $\beta = \text{borderCurvatureRatio}$ (por defecto $0.15$):
- **Cuerpo Central ($\beta \le \tau \le 1 - \beta$):**
  - Factor de borde $w = 0$.
  - Desplazamiento nominal: $D(s) = D_{\text{offset}}$.
  - Vector normal constante: $\vec{n}_B(s) = \vec{N}_{\text{out}}$.
  - Geometría estrictamente rectilínea y ortogonal.

- **Borde Inicial ($\tau < \beta$):**
  - $u = \frac{\tau}{\beta} \in [0, 1]$, $w = 0.5 \cdot (1 + \cos(\pi u))$.
  - **Deflexión hacia la carretera (en contra de las barras):**
    $$D(s) = D_{\text{offset}} - w \cdot (0.45 \cdot D_{\text{offset}})$$
  - Tracción tangencial de empalme circular: $\Delta \vec{T}_{\text{pull}} = + w \cdot \min(L_{\text{view}} \cdot 0.06, D_{\text{offset}} \cdot 0.35) \cdot \vec{T}$.
  - Rotación suave de la normal hacia atrás:
    $$\vec{n}_B(s) = \text{normalize}\left(\vec{N}_{\text{out}} - w \cdot 0.65 \cdot \vec{T}\right)$$

- **Borde Terminal ($\tau > 1 - \beta$):**
  - $u = \frac{1 - \tau}{\beta} \in [0, 1]$, $w = 0.5 \cdot (1 + \cos(\pi u))$.
  - **Deflexión hacia la carretera (en contra de las barras):**
    $$D(s) = D_{\text{offset}} - w \cdot (0.45 \cdot D_{\text{offset}})$$
  - Tracción tangencial de empalme circular: $\Delta \vec{T}_{\text{pull}} = - w \cdot \min(L_{\text{view}} \cdot 0.06, D_{\text{offset}} \cdot 0.35) \cdot \vec{T}$.
  - Rotación suave de la normal hacia adelante:
    $$\vec{n}_B(s) = \text{normalize}\left(\vec{N}_{\text{out}} + w \cdot 0.65 \cdot \vec{T}\right)$$

### 3.4 Resultado Visual
1. Las isolíneas de escala y la línea base convergen y se curvan de manera concéntrica hacia la carretera en ambos extremos.
2. La base del perfil permanece limpia y rectilínea en más del 70% central de la pantalla.
3. El botón semicircular y la línea conectora se mantienen rigurosamente en la distancia nominal $D_{\text{offset}}$, sin separaciones erráticas ni desplazamientos excesivos.
