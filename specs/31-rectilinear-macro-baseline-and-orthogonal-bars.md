# SPEC-31: Línea Base Rectilínea Macro-Simplificada y Barras Ortogonales sin Deformación (VisQuill Straight / Macro-Curved Baseline & Clean Bars)

## 1. Estado y Metadatos
- **ID:** SPEC-31
- **Título:** Línea Base Rectilínea Macro-Simplificada y Barras Ortogonales sin Deformación por Curvatura
- **Módulo:** `pkg/curvilinear`, `pkg/curvilinear/generator`, `ui/map-view`
- **Estado:** `IMPLEMENTED` (100% Tests Pass)
- **Referencias Visuales:**
  - Evidencia Local (Newcastle upon Tyne): `C:/Users/W11/.gemini/antigravity/brain/36bd6bb5-e6ba-4b2f-80dd-f10da79c3b09/.user_uploaded/media_1792016349934_97245bb0.png`
  - Evidencia Global (VisQuill UK A1 Corridor): `C:/Users/W11/.gemini/antigravity/brain/f622afdf-7999-4a6a-87bd-c304243b6a01/.user_uploaded/media_1791859504716_69041d96.png`
- **Especificaciones Relacionadas:**
  - SPEC-06 (Perfil Curvilíneo Paralelo al Trazo)
  - SPEC-20 (Anti-Knot y Regularización de Curvatura)
  - SPEC-24 (Mapeo por Longitud de Arco sobre la Línea Base)
  - SPEC-27 (Mapeo Local Estacionado y Acotamiento de Desviación)
  - SPEC-28 (Grilla de 4 Escalas Concéntricas y Handle Confinado)

---

## 2. Contexto y Diagnóstico del Problema

### 2.1 Hallazgo Crítico sobre el Paradigma Real de VisQuill
En la aproximación previa (SPEC-06, SPEC-20, SPEC-24 y SPEC-27), se asumió que la línea base ($B$) debía obtenerse realizando un **offset punto a punto de cada vértice de la carretera real** ($P(s) + D_{\text{offset}} \cdot \vec{n}_{\text{road}}(s)$) seguido de filtros de desenredo (*anti-knot*) y suavizado gaussiano.

Sin embargo, el análisis minucioso de la captura provista por el usuario (`media_1792016349934_97245bb0.png`) frente al corredor real de la carretera A1 (Newcastle Western Bypass) evidencia una diferencia de diseño fundamental:

1. **La Carretera Real es Fuertemente Curva:**
   - En el sector de Newcastle upon Tyne, la autovía A1 (trazo púrpura a la izquierda) realiza un bypass pronunciado hacia el oeste, contorneando Blaydon on Tyne, Swalwell y Whickham con radios de curvatura cerrados e inflexiones en "S".
2. **La Línea Base de VisQuill NO Sigue esas Curvas Locales:**
   - En lugar de desplazarse en paralelo a cada curva local, VisQuill ubica la línea base sobre un **eje macroscópico completamente RECTILÍNEO (línea recta continua)** situado en una zona despejada al oriente (sobre Dudley, Burradon, Wallsend, Hebburn y Springwell).
   - En la vista macroscópica de todo el Reino Unido, esta línea base se mantiene recta a lo largo de Inglaterra y únicamente transiciona con arcos de curvatura suave y de gran radio ($R > 50\text{ km}$) en los bordes y cambios mayores de dirección territorial (como al bordear la costa este de Escocia hacia Edimburgo).
3. **Consecuencias Positivas del Eje Rectilíneo / Macro-Simplificado:**
   - **Barras Estrictamente Paralelas y Rectangulares:** Al ser la línea base recta en el tramo de inspección, el vector normal $\vec{n}_B$ es constante. Las barras no convergen ni divergen; son rectángulos puros de ancho métrico uniforme ($100\text{ m}$) proyectados perpendicularmente sin distorsión trapezoidal.
   - **Isolíneas de Escala Rectas:** Las 4 líneas de referencia de la grilla (marcas 12, 24, 36, 48) son rectas paralelas equidistantes, lo que permite comparar visualmente alturas de siniestralidad con precisión cartesiana instantánea.
   - **Eliminación Total de Nudos y Solapamientos:** Se evitan por completo los problemas de auto-intersección (*anti-knotting*), compresión lateral o expansión angular producidos por las curvas cerradas del eje vial.
   - **Visualización Limpia ("Clean Visualization"):** Despeja la carretera y traslada el histograma a un corredor despejado, mejorando sustancialmente la legibilidad cartográfica.

---

## 3. Fundamentos Matemáticos y Modelo Geométrico

```
                  Carretera Real T(s)
              (Curvas locales, bypass, giros)
                     ╭───────╮
              ───────╯       ╰───────►
                         \
                          \  Línea conectora de progresiva
                           \
         ═══════════════════════════════════════►  Isolínea Escala 4 (ej. 48)
         ───────────────────────────────────────►  Isolínea Escala 3 (ej. 36)
         ───────────────────────────────────────►  Isolínea Escala 2 (ej. 24)
         ───────────────────────────────────────►  Isolínea Escala 1 (ej. 12)
              │ █ │   │ █ █ │ │   │
              │ █ │   │ █ █ │ │   │ ◄── Barras Rectangulares Paralelas
         ═════╧═══╧═══╧═════╧═╧═══╧═════════════►  Línea Base Rectilínea B
              u_0                         u_max
```

### 3.1 Construcción de la Línea Base Macro-Rectilínea ($B_{\text{macro}}$)

Para un alineamiento vial visible $A$ con rango de progresivas $[S_{\min}, S_{\max}]$:
1. **Determinación de Extremos del Corredor:**
   - Sean $P_{\text{start}} = \text{coord}(S_{\min})$ y $P_{\text{end}} = \text{coord}(S_{\max})$ los puntos extremos del tramo en el eje vial.
   - Se calcula el vector director global del tramo en el plano geodésico proyectado:
     $$\vec{V}_{\text{corredor}} = \frac{P_{\text{end}} - P_{\text{start}}}{\|P_{\text{end}} - P_{\text{start}}\|}$$
   - Se obtiene el vector normal unitario transversal global:
     $$\vec{N}_{\text{corredor}} = \text{rotate90}(\vec{V}_{\text{corredor}}, \text{side})$$
2. **Generación de la Línea Base Desplazada:**
   - La línea base $B_{\text{macro}}$ se define como el segmento recto que une:
     $$B_{\text{start}} = P_{\text{start}} + D_{\text{offset}} \cdot \vec{N}_{\text{corredor}}$$
     $$B_{\text{end}} = P_{\text{end}} + D_{\text{offset}} \cdot \vec{N}_{\text{corredor}}$$
   - Su longitud total rectilínea es:
     $$L_B = \text{haversine}(B_{\text{start}}, B_{\text{end}})$$

> [!NOTE] En trazados muy extensos que abarquen múltiples regiones o cambien drásticamente de orientación (> 45°), la línea base se conforma como una polilínea macro-simplificada (usando Ramer-Douglas-Peucker con alta tolerancia $\epsilon \ge 1\text{ km}$ o empalmes circulares de gran radio en los vértices), manteniendo cada tramo recto como un segmento rectilíneo puro.

### 3.2 Función de Mapeo de Progresivas Viales a la Línea Base ($s \mapsto B(s)$)

Para cualquier progresiva vial $s \in [S_{\min}, S_{\max}]$:
1. Se calcula la fracción métrica normalizada:
   $$\tau(s) = \frac{s - S_{\min}}{S_{\max} - S_{\min}} \in [0, 1]$$
2. La coordenada en la línea base rectilínea es:
   $$B(s) = (1 - \tau(s)) \cdot B_{\text{start}} + \tau(s) \cdot B_{\text{end}}$$
3. El vector normal exterior en cualquier punto de la línea base rectilínea es idéntico y uniforme:
   $$\vec{n}_B(s) = \vec{N}_{\text{corredor}} \quad \forall s \in [S_{\min}, S_{\max}]$$

### 3.3 Geometría de Barras Rectangulares Perfectas

Para cada bin $k$ correspondiente al intervalo de progresiva $[s_k, s_{k+1}]$ con valor de métrica $V_k > 0$:
1. **Puntos Base:**
   $$P_{\text{start}} = B(s_k), \quad P_{\text{end}} = B(s_{k+1})$$
2. **Puntos Extruidos:**
   $$H_k = V_k \cdot K_{\text{scale}}$$
   $$Q_{\text{start}} = P_{\text{start}} + H_k \cdot \vec{N}_{\text{corredor}}$$
   $$Q_{\text{end}} = P_{\text{end}} + H_k \cdot \vec{N}_{\text{corredor}}$$
3. **Propiedades del Polígono resultante:**
   - El segmento $\overline{P_{\text{start}} P_{\text{end}}}$ es colineal con la línea base $B$.
   - El segmento $\overline{Q_{\text{start}} Q_{\text{end}}}$ es estrictamente paralelo a la base.
   - Los segmentos laterales $\overline{P_{\text{start}} Q_{\text{start}}}$ y $\overline{P_{\text{end}} Q_{\text{end}}}$ son estrictamente ortogonales a la base ($\angle = 90.0^\circ$).
   - Todos los cuadriláteros resultantes son **rectángulos euclidianos puros**, sin distorsión trapezoidal, colisiones ni deformación de anchos.

### 3.4 Isolíneas de Escala Rectilíneas y Rayos de Grilla

Para cada valor de escala de referencia $V_j \in [12, 24, 36, 48]$:
1. La isolínea es una línea recta paralela continua:
   $$\text{Line}_j = \left[ B_{\text{start}} + (V_j \cdot K_{\text{scale}}) \cdot \vec{N}_{\text{corredor}},\ B_{\text{end}} + (V_j \cdot K_{\text{scale}}) \cdot \vec{N}_{\text{corredor}} \right]$$
2. Los rayos transversales de la grilla en los extremos unen perpendicularmente la base con la isolínea superior.

### 3.5 Puntero Interactivo y Línea Conectora Suave

Al interactuar con el puntero en la progresiva $s$:
- Punto en carretera: $P_{\text{road}}(s) = \text{interpolateAtStation}(A, s)$
- Punto en la línea base: $P_{\text{base}}(s) = B(s)$
- Línea conectora: une $P_{\text{road}}(s)$ con $P_{\text{base}}(s)$ mediante un trazo limpio, ilustrando con claridad la correspondencia entre el punto real del camino y la barra del histograma rectilíneo.

---

## 4. Opciones de Configuración y Compatibilidad

Para preservar la flexibilidad y permitir al usuario elegir entre ambos estilos visuales, se define la opción:
```typescript
export type BaselineMode = 'RECTILINEAR' | 'CURVED_OFFSET';

export interface CurvilinearProfileOptions {
  /** Modo de línea base: 'RECTILINEAR' (VisQuill limpio por defecto) o 'CURVED_OFFSET' (offset local) */
  baselineMode?: BaselineMode;
  offsetDistanceMeters: number;
  side: 'LEFT' | 'RIGHT';
  heightScaleMetersPerUnit: number;
  scaleTicks: number[];
  // ...
}
```

---

## 5. Criterios de Aceptación (Test-Driven Acceptance Criteria)

- **Test Case 31.1 (Línea Base Rectilínea):**
  En modo `RECTILINEAR`, todos los puntos generados de la línea base $B$ entre los extremos visibles deben ser colineales (desviación máxima menor a $10^{-4}$ grados o $0.01\text{ m}$ respecto a la recta secante).
- **Test Case 31.2 (Ortogonalidad Estricta y Paralelismo de Barras):**
  Las aristas laterales de cada barra deben ser colineales al vector normal uniforme $\vec{N}_{\text{corredor}}$, garantizando ángulos rectos exactos de $90^\circ$ en todos sus vértices.
- **Test Case 31.3 (Isolíneas de Escala Paralelas y Rectas):**
  Cada una de las 4 isolíneas de escala debe ser un segmento recto con distancia métrica euclidiana constante respecto a la línea base en todos sus puntos.
- **Test Case 31.4 (Correspondencia Monótona de Progresivas):**
  La función de muestreo $s \mapsto B(s)$ debe ser estrictamente monótona creciente a lo largo del segmento, mapeando de forma unívoca el rango $[S_{\min}, S_{\max}]$.
- **Test Case 31.5 (Supresión de Bins Vacíos):**
  Los bins con valor 0 no generan geometría poligonal, manteniendo la línea base completamente despejada.

---

## 6. Trazabilidad e Impacto de Archivos

| Archivo / Componente | Rol y Modificación Planificada |
| :--- | :--- |
| `src/pkg/curvilinear/types.ts` | Definición de `BaselineMode` (`'RECTILINEAR' \| 'CURVED_OFFSET'`) y soporte en `CurvilinearProfileOptions`. |
| `src/pkg/curvilinear/generator.ts` | Generación de línea base rectilínea secante con normal uniforme cuando `baselineMode === 'RECTILINEAR'`. |
| `src/pkg/curvilinear/pointer.ts` | Posicionamiento de puntero y conector sobre la recta base. |
| `src/ui/map-view.ts` | Configuración por defecto a modo rectilíneo limpio. |
| `tests/unit/curvilinear/rectilinear-baseline.test.ts` | Suite de tests unitarios de validación de SPEC-31. |
