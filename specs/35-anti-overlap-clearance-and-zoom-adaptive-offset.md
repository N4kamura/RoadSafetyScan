# SPEC-35: Despeje Geométrico Anti-Superposición y Escalamiento Dinámico de Separación Lateral por Zoom (Anti-Overlap Clearance & Zoom-Adaptive Lateral Offset)

## 1. Estado y Metadatos
- **ID:** SPEC-35
- **Título:** Despeje Geométrico Anti-Superposición de Línea Base y Escalamiento Dinámico de Separación Lateral por Zoom
- **Módulo:** `pkg/curvilinear`, `pkg/curvilinear/generator`, `ui/map-view`, `ui`
- **Estado:** `IMPLEMENTED` (100% Tests Pass)
- **Referencias Visuales:**
  - Evidencia de superposición en zoom alejado (Lima / Vía de Evitamiento / Panamericana Sur): `C:/Users/W11/.gemini/antigravity/brain/36bd6bb5-e6ba-4b2f-80dd-f10da79c3b09/.user_uploaded/media_1792023364122_c38b81c5.png`
  - Evidencia de separación limpia en zoom general (VisQuill UK A1 Corridor): `C:/Users/W11/.gemini/antigravity/brain/36bd6bb5-e6ba-4b2f-80dd-f10da79c3b09/.user_uploaded/media_1792021610862_c7ef0c05.png`
- **Especificaciones Relacionadas:**
  - SPEC-06 (Perfil Curvilíneo Paralelo al Trazo)
  - SPEC-09 (Límites de Zoom & Autoescala)
  - SPEC-31 (Línea Base Rectilínea & Barras Ortogonales Limpias)
  - SPEC-34 (Bordes Curvos Invariables hacia el Lado Opuesto de las Barras)

---

## 2. Contexto y Diagnóstico del Problema

### 2.1 Diagnóstico de Superposición y Colisión en Trazados con Flecha Pronunciada
Al alejar el zoom en corredores urbanos o interurbanos con inflexiones o giros en "C" (como la Panamericana Sur en Lima rodeando Monterrico/Surco hacia Villa El Salvador):
1. **Colisión de la Línea Base con la Vía:**
   - La secante del tramo visible conecta los extremos de la pantalla. Si el eje vial real presenta una curvatura o flecha (*sagitta*) que se proyecta lateralmente hacia el lado del histograma ($d_{\text{lateral}} > 0$), la carretera sobrepasa la secante en miles de metros.
   - Si la separación lateral nominal configurada ($D_{\text{offset}}$) es menor que la flecha máxima de la carretera ($d_{\text{lateral, max}}$), la línea base rectilínea **corta y se superpone físicamente con la carretera**, generando una visualización defectuosa donde las barras atraviesan el asfalto.

2. **Límites de Configuración Demasiado Bajos:**
   - El control deslizante (*slider*) en la interfaz limitaba la separación a solo $2,500\text{ m}$, y las pastillas rápidas a $1,800\text{ m}$. En escalas metropolitanas o regionales (20–50 km de extensión), $2,500\text{ m}$ representa menos de 30 píxeles en pantalla, siendo insuficiente para despejar la silueta urbana.

3. **Invarianza Métrica del Offset frente a Variación de Escala en Pantalla:**
   - A niveles de zoom cercanos (zoom 14–16), $1,200\text{ m}$ equivale a 150–300 píxeles, luciendo perfectamente espaciado.
   - Sin embargo, a niveles de zoom lejanos (zoom 10–12), $1,200\text{ m}$ se reduce a apenas 15–25 píxeles, colapsando visualmente la línea base sobre el trazo vial y sus franjas de buffer.

---

## 3. Fundamentos Matemáticos y Modelo Geométrico

### 3.1 Garantía Geométrica Anti-Superposición (Anti-Overlap Bounding Clearance)
Para cualquier tramo visible $[s_{\min}, s_{\max}]$, con secante $S(\tau) = P(s_{\min}) + \tau \cdot (P(s_{\max}) - P(s_{\min}))$ y vector normal unitario $\vec{N}_{\text{out}}$:

Para cada punto de la carretera $P(s)$ en el tramo visible:
$$d_{\text{lateral}}(s) = (P(s) - S(\tau(s))) \cdot \vec{N}_{\text{out}}$$
Se determina la máxima excursión o flecha positiva de la vía hacia el lado del perfil:
$$d_{\text{bulge, max}} = \max\left(0, \max_{s \in [s_{\min}, s_{\max}]} d_{\text{lateral}}(s)\right)$$

La separación base efectiva garantizada es:
$$D_{\text{clearance}} = d_{\text{bulge, max}} + D_{\text{offset}}$$

**Teorema de No Intersección:**
Para todo punto $s \in [s_{\min}, s_{\max}]$, la distancia lateral del punto de la carretera al punto base de la línea base satisface:
$$\text{dist}_{\text{lateral}}(P(s), B(s)) \ge D_{\text{offset}} > 0$$
La línea base permanece matemáticamente exterior a la vía sin importar la magnitud de la curva.

### 3.2 Escalamiento Dinámico del Offset con el Nivel de Zoom
En `map-view.ts`, la separación configurada se escala suavemente cuando el usuario aleja el mapa:
$$D_{\text{effective}}(zoom) = D_{\text{config}} \cdot \text{computeZoomScaleFactor}(zoom, 13.0, \gamma = 0.70, \text{maxFactor} = 5.0)$$
- Para $zoom \ge 13$: Factor $= 1.0$ (preserva exactamente el valor configurado por el usuario en zoom cercano).
- Para $zoom < 13$: Escala progresivamente hasta $5.0\times$ en vistas macro, garantizando una separación visual de 60–100 píxeles en cualquier zoom.

### 3.3 Ampliación de Límites en la Interfaz de Usuario
- Slider de Separación Lateral: Rango ampliado de $400\text{ m}$ a $8,000\text{ m}$ (paso de $100\text{ m}$).
- Pastillas Rápidas de Mapa: Opciones de $800\text{ m}$, $1.5\text{ km}$, $3\text{ km}$ y $5\text{ km}$.
