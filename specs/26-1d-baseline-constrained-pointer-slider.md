# SPEC-26: Constreñimiento 1D del Puntero sobre la Línea Base Offset (1D Baseline-Constrained Pointer Slider)

## 1. Estado y Metadatos
- **ID:** SPEC-26
- **Título:** Constreñimiento 1D del Puntero sobre la Línea Base Offset
- **Módulo:** `pkg/curvilinear/pointer`, `ui/map-view`
- **Estado:** `APPROVED` / `FROZEN`
- **Referencias:**
  - SPEC-11 (Puntero Interactivo Bidireccional)
  - SPEC-12 (Asa Interactiva de Escala de Barras)
  - SPEC-24 (Mapeo por Longitud de Arco sobre la Línea Base)

---

## 2. Contexto y Requerimiento

En la versión previa, el botón semicircular del puntero (marcador negro de MapLibre GL) permitía arrastre libre 2D (`draggable: true`).
- Al hacer clic y arrastrar el cursor por la pantalla, el marcador se despegaba de la línea offset negra y flotaba libremente por el mapa (sobre la carretera o el mar), ajustándose de nuevo a la línea base recién al soltar el ratón (`dragend`).
- **Requerimiento Explícito:**
  1. El botón semicircular **siempre debe estar pegado al trazo offset (la línea base negra)**.
  2. **No debe ser desplazable hacia cualquier dirección**: su movimiento debe estar estrictamente constreñido a 1 dimensión, deslizándose exclusivamente a lo largo del riel geométrico de la línea base offset negra.

---

## 3. Modelo Matemático y Algorítmico

### 3.1 Proyección Ortogonal sobre la Línea Base Regularizada ($B$)
Dada la polilínea base regularizada $B = [C_0, C_1, \dots, C_M]$ con distancias acumuladas $u_0 = 0, \dots, u_M = L_B$:
Cuando el usuario arrastra el cursor del ratón a una coordenada geográfica arbitraria $M = (\text{lon}_M, \text{lat}_M)$:

1. Se proyecta $M$ sobre cada segmento $j \in [0, M-1]$ de la línea base:
   $$t_j = \text{clamp}\left( \frac{(M - C_j) \cdot (C_{j+1} - C_j)}{\|C_{j+1} - C_j\|^2}, 0, 1 \right)$$
   Punto candidato en el segmento:
   $$Q_j = C_j + t_j \cdot (C_{j+1} - C_j)$$
   Distancia métrica: $d_j = \text{haversine}(M, Q_j)$.

2. Se selecciona el segmento $j^*$ que minimiza la distancia $d_{j^*}$.
3. La posición de arco correspondiente sobre la línea base es:
   $$u_{\text{cursor}} = u_{j^*} + t_{j^*} \cdot (u_{j^*+1} - u_{j^*})$$
4. La progresiva métrica vial asociada es:
   $$s = \frac{u_{\text{cursor}}}{L_B} \cdot L_{\text{road}}$$

### 3.2 Forzado de Posición en Tiempo Real Durante el Arrastre (`drag`)
Durante todo el ciclo de arrastre del marcador (`dragstart`, `drag`, `dragend`):
1. El evento `drag` intercepta la coordenada del cursor del ratón.
2. Inmediatamente se proyecta a la línea base obteniendo $u_{\text{cursor}}$ y $s$.
3. Se actualiza forzosamente la posición del marcador en pantalla:
   $$\text{marker.setLngLat}(B(u_{\text{cursor}}))$$
   $$\text{marker.setRotation}(\theta_{\text{tangente}}(u_{\text{cursor}}))$$
4. Esto anula el desplazamiento 2D del cursor y convierte al botón semicircular en un **control deslizante 1D (slider en riel curvo)** que nunca se despega del trazo offset negro.

### 3.3 Orientación Tangencial y Línea Conectora
- El diámetro plano del semicírculo se alinea exactamente paralelo a la tangente de la línea base en $u$.
- El domo redondeado apunta orgánicamente hacia la carretera.
- La línea conectora une continuamente $P_{\text{road}}(s)$ con $B(u)$.

---

## 4. Criterios de Aceptación (Test Cases)

- **Test Case 26.1 (Proyección Directa sobre la Línea Base):**
  Dada una coordenada cualquiera desplazada lateralmente 2,000 m de la línea base, la función `projectPointToBaselineArcLength` retorna la progresiva de arco $u$ más cercana en la polilínea $B$.
- **Test Case 26.2 (Desviación Cero del Marcador):**
  La coordenada calculada para el marcador (`baselineCoord`) pertenece estrictamente a los segmentos de la línea base $B$ con distancia de despegue $0.0\text{ m}$.
- **Test Case 26.3 (Constreñimiento de Arrastre 1D):**
  Durante la ejecución de un evento de arrastre, el marcador es reposicionado exclusivamente a lo largo del perfil de la línea base.
- **Test Case 26.4 (Sincronización de Progresiva Vial y LRS):**
  Al deslizar el puntero sobre la línea base a la posición de arco $u$, la progresiva vial $s$ calculada y el bin LRS activo corresponden exactamente a la posición proporcional del alineamiento.

---

## 5. Trazabilidad
- `src/pkg/curvilinear/pointer.ts`: Algoritmo `projectPointToBaselineArcLength` y proyección 1D.
- `src/ui/map-view.ts`: Interceptación continua en `drag` fijando `setLngLat(geom.baselineCoord)` en todo momento.
- `tests/unit/curvilinear/baseline-constrained-pointer.test.ts`: Pruebas de constreñimiento 1D y proyección.
