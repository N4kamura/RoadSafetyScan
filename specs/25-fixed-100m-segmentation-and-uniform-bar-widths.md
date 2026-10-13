# SPEC-25: Segmentación Métrica Fija a 100m y Barras de Ancho Uniforme (Fixed 100m Segmentation & Uniform Bar Widths)

## 1. Estado y Metadatos
- **ID:** SPEC-25
- **Título:** Segmentación Métrica Fija a 100m y Barras de Ancho Uniforme
- **Módulo:** `pkg/curvilinear`, `pkg/lrs`, `ui/map-view`
- **Estado:** `APPROVED` / `FROZEN`
- **Referencias:**
  - Paradigma VisQuill GDK A1 Collision Density: `https://visquill.com/gallery/uk-a1`
  - SPEC-03 (Motor LRS, Buffer, EPDO & Densidad)
  - SPEC-06 (Perfil Curvilíneo Paralelo)
  - SPEC-23 (Recorte al Viewport & Segmentación Dinámica)
  - SPEC-24 (Mapeo por Longitud de Arco & Supresión de Cero)

---

## 2. Contexto y Requerimiento

El usuario identificó una inconsistencia visual derivada de la variación dinámica del tamaño de bin según el zoom (introducida en SPEC-23):
- Al alejar el zoom, los bins cambiaban automáticamente a 200m, 500m, 1,000m o 2,000m. Esto provocaba que las barras se ensancharan desproporcionadamente y cubrieran áreas adyacentes donde no ocurrieron siniestros.
- **Requerimiento Explícito:**
  1. Todas las barras generadas deben tener **siempre el mismo ancho longitudinal uniforme**, sin importar el nivel de zoom.
  2. Si un tramo no tiene datos de siniestros, se mantiene en 0 y **no se dibuja** (espacio limpio en la línea base).
  3. Esto exige fijar el valor de segmentación métrica de forma constante y normativa a **$\Delta S = 100\text{ m}$**.

---

## 3. Modelo Matemático y Algorítmico

### 3.1 Discretización Homogénea Invariable ($\Delta S = 100\text{ m}$)
El análisis de referenciación lineal (LRS) y la generación del perfil curvilíneo se bloquean a una resolución constante:
$$\Delta S_{\text{normativo}} = 100.0\text{ metros}$$

Para un alineamiento vial de longitud total $L_{\text{road}}$, el número total de bins discretos es:
$$N = \left\lceil \frac{L_{\text{road}}}{\Delta S} \right\rceil$$
donde cada bin $k \in [0, N-1]$ abarca el intervalo de carretera $[k \cdot 100, \min((k+1) \cdot 100, L_{\text{road}})]$.

### 3.2 Ancho Longitudinal Uniforme sobre la Línea Base ($\Delta u$)
Dada la línea base regularizada $B$ con longitud total de arco $L_B$ (conforme a SPEC-24):
Para cada bin estándar de 100 metros, su extensión de arco a lo largo de la línea base es:
$$\Delta u_k = \frac{100.0}{L_{\text{road}}} \cdot L_B \approx \text{constante}$$

Las bases de todas las barras poligonales cumplen:
$$\text{longitud\_arco}(P_{\text{start}, k}, P_{\text{end}, k}) = \Delta u_k$$
garantizando que ninguna barra sea más ancha ni más angosta que las demás.

### 3.3 Supresión de Tramos Vacíos (Zero-Value Suppression)
Para cada bin $k$:
- Si $\text{valor}_k = 0$ (o $\text{personas}_k = 0$ en modo PERSONS): **no se genera ningún polígono de barra**. El espacio sobre la línea base $B$ queda libre, permitiendo observar la carretera y la curva base despejada.
- Si $\text{valor}_k > 0$: se extruye la barra de ancho fijo $\Delta u_k$ con altura proporcional a la métrica.

### 3.4 Desacoplamiento del Zoom respecto al Tamaño de Bin
- El nivel de zoom **no modifica** el tamaño de bin (`binSizeMeters` permanece fijo en 100 m).
- El recorte al viewport (SPEC-23) continúa operando para filtrar qué bins de 100 m caen dentro de la pantalla, evitando renderizar tramos fuera de la vista pero manteniendo inalterada la resolución de 100 m.

---

## 4. Criterios de Aceptación (Test Cases)

- **Test Case 25.1 (Resolución Fija a 100m):**
  La configuración del perfil curvilíneo mantiene invariablemente `binSizeMeters = 100` sin alternar a 200m, 500m ni 2000m al cambiar el zoom del mapa.
- **Test Case 25.2 (Uniformidad de Ancho de Barras):**
  Para un alineamiento homogéneo, todas las barras generadas con $\Delta S = 100\text{ m}$ poseen la misma longitud de arco sobre la línea base con una tolerancia menor al 1%.
- **Test Case 25.3 (Conservación de Espacios Vacíos):**
  En un tramo vial con siniestros dispersos, los bins intermedios sin siniestros no generan entidades en la colección de barras, preservando intervalos limpios sobre la línea base.
- **Test Case 25.4 (Recorte al Viewport con Bins de 100m):**
  El recorte al viewport procesa únicamente los bins de 100m visibles en pantalla sin fusionarlos en macro-bins.

---

## 5. Trazabilidad
- `src/pkg/curvilinear/viewport.ts`: Estandarización de segmentación normativa a 100m.
- `src/ui/map-view.ts`: Eliminación del rebinnado dinámico en eventos `move` y `zoom`.
- `tests/unit/curvilinear/fixed-100m-uniform-bars.test.ts`: Pruebas unitarias de uniformidad y fijación a 100m.
