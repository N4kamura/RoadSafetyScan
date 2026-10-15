# SPEC-32: Línea Base Global Estable con Bordes Curvos y Garantía Antigiro (Globally-Stable Baseline with Curved Arc Transitions & Anti-Rotation)

## 1. Estado y Metadatos
- **ID:** SPEC-32
- **Título:** Línea Base Global Estable con Bordes Curvos y Garantía Antigiro
- **Módulo:** `pkg/curvilinear`, `pkg/curvilinear/generator`, `ui/map-view`
- **Estado:** `IMPLEMENTED` (100% Tests Pass)
- **Referencias Visuales:**
  - Evidencia Global VisQuill A1 Corridor con Bordes Curvos: `C:/Users/W11/.gemini/antigravity/brain/36bd6bb5-e6ba-4b2f-80dd-f10da79c3b09/.user_uploaded/media_1792018894310_93c77c02.png`
  - Evidencia Local Rectilínea en Tramo Intermedio (Newcastle upon Tyne): `C:/Users/W11/.gemini/antigravity/brain/36bd6bb5-e6ba-4b2f-80dd-f10da79c3b09/.user_uploaded/media_1792016349934_97245bb0.png`
- **Especificaciones Relacionadas:**
  - SPEC-06 (Perfil Curvilíneo Paralelo)
  - SPEC-23 (Recorte al Viewport & Segmentación)
  - SPEC-24 (Mapeo por Longitud de Arco)
  - SPEC-27 (Mapeo Local Estacionado)
  - SPEC-31 (Línea Base Rectilínea Macro-Simplificada)

---

## 2. Contexto y Diagnóstico del Problema

### 2.1 Diagnóstico de Inestabilidad Angular en Pan/Zoom (Efecto Giro)
En la implementación inicial de SPEC-31, la línea base rectilínea se calculaba evaluando la secante de la vía entre las progresivas extremas visibles del viewport:
$$P_{\text{start}} = P(rangeStart), \quad P_{\text{end}} = P(rangeEnd)$$
Cuando el usuario desplazaba el mapa (*pan*) o cambiaba el nivel de zoom, $rangeStart$ y $rangeEnd$ cambiaban de forma continua. Como la carretera real contiene curvas, rodeos y variaciones angulares, el vector secante cambiaba de dirección en cada cuadro (*frame*). Esto producía un indeseable **efecto de rotación o pivoteo continuo** de la base de las barras al navegar por el mapa.

### 2.2 Paradigma VisQuill: Bordes Curvos y Estabilidad Global
Al observar la visualización original de VisQuill (`media_1792018894310_93c77c02.png`):
1. **La Línea Base es Global e Invariable:**
   - La geometría de la línea base no depende de los límites del viewport momentáneo. Se calcula una única vez para todo el alineamiento (o corredor activo) en coordenadas geográficas absolutas.
   - Durante el paneo o zoom, la línea base **permanece inmóvil** en el espacio cartográfico (**garantía antigiro estricta**). El recorte por viewport solo decide qué barras $[s_k, s_{k+1}]$ se renderizan, sin alterar la geometría de la base.
2. **Bordes Curvos Suaves en Extremos y Giros Mayores:**
   - En VisQuill, el trazado base es recto a lo largo del cuerpo principal del corredor, pero en los extremos terminales (bordes superior e inferior) y en giros mayores del territorio (como la entrada a Escocia hacia Edimburgo), la línea base **se curva suavemente mediante arcos circulares continuos**.
   - Esto evita discontinuidades en los bordes y permite que las barras y las 4 isolíneas concéntricas abracen la curvatura global del territorio de manera orgánica y sin quiebres abruptos.

---

## 3. Fundamentos Matemáticos y Modelo Geométrico

### 3.1 Construcción de la Línea Base Global con Empalmes Curvos

Sea $A$ el alineamiento vial con progresivas $s \in [0, L_{\text{total}}]$.
1. **Columna Vertebral Global (Global Backbone):**
   - Se muestrea el eje vial completo a intervalos regulares $\Delta s \le 50\text{ m}$.
   - Se calcula el vector director global del corredor completo $P(0) \to P(L_{\text{total}})$:
     $$\vec{V}_{\text{global}} = \frac{P(L_{\text{total}}) - P(0)}{\|P(L_{\text{total}}) - P(0)\|}, \quad \vec{N}_{\text{global}} = \text{rotate90}(\vec{V}_{\text{global}}, \text{side})$$
2. **Generación de la Polilínea Base Regularizada con Transición en Bordes:**
   - Para cada estación muestreada $s_i \in [0, L_{\text{total}}]$, se calcula su posición relativa normalizada $\tau(s_i) = s_i / L_{\text{total}} \in [0, 1]$.
   - Se define una función de ponderación de curvatura en los bordes:
     - En el cuerpo central ($\tau \in [0.15, 0.85]$): La línea base se rige por el vector secante rectilíneo global con normal constante $\vec{N}_{\text{global}}$.
     - En los bordes terminales ($\tau < 0.15$ o $\tau > 0.85$) y en zonas de deflexión macroscópica ($> 30^\circ$): Se introduce una curvatura de empalme suave (*fillet arc* / transición coseno-gaussiana) que orienta gradualmente el vector normal hacia la dirección del eje vial local sin discontinuidades $C^1$.
   - La normal en cada estación $s_i$ es:
     $$\vec{n}_B(s_i) = \text{normalize}\left( (1 - w(s_i)) \cdot \vec{N}_{\text{global}} + w(s_i) \cdot \vec{n}_{\text{road, smooth}}(s_i) \right)$$
     donde $w(s_i) \in [0, 1]$ es 0 en el tramo central rectilíneo y asciende suavemente en los bordes terminales ($w(0) \approx 0.6$).
   - La coordenada base es:
     $$B(s_i) = \text{offsetCoordinate}(P(s_i), \vec{n}_B(s_i), D_{\text{offset}})$$
   - Se aplica un filtro laplaciano de regularización para garantizar tangentes y normales estrictamente monótonas y sin inflexiones.

### 3.2 Independencia de Viewport y Garantía Antigiro (Anti-Rotation Invariance)

Sea $V_1$ y $V_2$ dos viewports con rangos visibles distintos $[s_a, s_b]$ y $[s_c, s_d]$:
- La posición $B(s)$ y la normal $\vec{n}_B(s)$ para cualquier estación $s$ son idénticas en ambos viewports:
  $$B_{V_1}(s) \equiv B_{V_2}(s), \quad \vec{n}_{B, V_1}(s) \equiv \vec{n}_{B, V_2}(s) \quad \forall s$$
- **Resultado:** Al hacer pan o zoom, la línea base no gira ni un solo grado en pantalla. Las barras permanecen ancladas rígidamente a sus posiciones geográficas.

---

## 4. Criterios de Aceptación (Test-Driven Acceptance Criteria)

- **Test Case 32.1 (Garantía Antigiro estricta en Paneo/Zoom):**
  Al generar perfiles para diferentes rangos de viewport sobre la misma carretera, las coordenadas $B(s)$ y los vectores normales $\vec{n}_B(s)$ en cualquier progresiva compartida $s$ deben ser idénticos (desviación angular $0.0^\circ$, desviación métrica $< 0.001\text{ m}$).
- **Test Case 32.2 (Bordes Curvos Continuos en Extremos):**
  En los extremos terminales del corredor ($s < 0.15 L$ y $s > 0.85 L$), la variación angular de los vectores normales $\vec{n}_B(s)$ es suave y continua ($C^1$), curvándose gradualmente para acompañar el giro territorial sin quiebres abruptos.
- **Test Case 32.3 (Cuerpo Central Rectilíneo y Limpio):**
  En el tramo central del corredor ($0.20 L \le s \le 0.80 L$), las normales son uniformes y las barras son paralelas, preservando la estética cartesiana limpia de VisQuill.
- **Test Case 32.4 (Isolíneas Concéntricas en Arcos y Rectas en el Centro):**
  Las isolíneas de escala se mantienen paralelas a la base en todo momento, siendo rectas en el centro y arcos concéntricos suaves en los bordes.

---

## 5. Trazabilidad e Impacto
- `src/pkg/curvilinear/generator.ts`: Implementación de la línea base global estable con transición suave en bordes.
- `src/ui/map-view.ts`: Almacenamiento en caché de la línea base global del alineamiento y desvinculación de la orientación del viewport.
- `tests/unit/curvilinear/stable-baseline-anti-rotation.test.ts`: Suite de pruebas unitarias para SPEC-32.
