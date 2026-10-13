# SPEC-03: Motor de Referenciación Lineal (LRS) y Agregación

- **ID:** SPEC-03
- **Módulo:** `pkg/lrs`
- **Estado:** `IMPLEMENTED` (Completado y verificado con pruebas unitarias y de integración)
- **Dependencias:** `SPEC-01` (Dataset de siniestros), `SPEC-02` (Alineamiento vial)
- **Trazabilidad:** [Constitution - Module 3 & Principle 3](file:///d:/Projects/RoadSafetyScan/constitution.md#L24-L28)

---

## 1. Propósito y Alcance

Formalizar el motor matemático y algorítmico de **Referenciación Lineal (Linear Referencing System - LRS)**.

El motor transforma las coordenadas geográficas bidimensionales $(X_i, Y_i)$ de cada siniestro vial en un espacio de coordenadas lineales unidimensionales $(S_i, D_{\perp i})$, donde:
- $S_i$: Distancia longitudinal acumulada (progresiva / cadenamiento) a lo largo del eje vial desde el origen ($km\ 0+000$).
- $D_{\perp i}$: Desviación lateral u ortogonal respecto al eje (en metros, con signo para distinguir margen izquierda/derecha).

Asimismo, ejecuta el filtrado por buffer de influencia paramétrico y la agregación en intervalos métricos regulares ($\Delta S$) para alimentar el perfilador longitudinal.

---

## 2. Modelos de Datos TypeScript

```typescript
import { CrashPoint, SeverityLevel, CrashType } from '../pkg/data';
import { Alignment, AlignmentSegment } from '../pkg/tracer';

export enum RoadSide {
  LEFT = 'LEFT',       // Margen izquierda según sentido del eje
  RIGHT = 'RIGHT',     // Margen derecha según sentido del eje
  CENTER = 'CENTER'    // Exactamente sobre el eje (|D_perp| < 0.05m)
}

export interface ProjectedCrash {
  crash: CrashPoint;
  segmentIndex: number;
  projectionPoint: [longitude: number, latitude: number]; // Punto proyectado en el eje
  chainageMeters: number;                                 // S_i en metros
  stationFormatted: string;                               // 'km K+PPP.PP'
  lateralDistanceMeters: number;                          // |D_perp| absoluto en metros
  signedLateralDistanceMeters: number;                    // D_perp con signo (+ derecha, - izquierda)
  side: RoadSide;
  isInsideBuffer: boolean;
}

export interface LrsBinAggregate {
  binIndex: number;
  startChainageMeters: number;
  endChainageMeters: number;
  startStationFormatted: string;
  endStationFormatted: string;
  crashes: ProjectedCrash[];
  totalCount: number;
  severityCounts: Record<SeverityLevel, number>;
  typeCounts: Record<CrashType, number>;
  epdoScore: number;                                     // Índice de Severidad Ponderada
  densityPerKm: number;                                  // Siniestros normalizados por kilómetro
}

export interface LrsEngineOptions {
  bufferWidthMeters: number;     // Umbral de tolerancia de ancho de calzada/faja (ej. 25m)
  binSizeMeters: number;         // Intervalo de segmentación longitudinal (ej. 100m)
  epdoWeights?: {
    fatal: number;               // Peso fallecido (default: 9.5)
    grave: number;               // Peso lesiones graves (default: 3.5)
    leve: number;                // Peso lesiones leves (default: 1.0)
    soloDanos: number;           // Peso solo daños (default: 1.0)
  };
}

export interface LrsAnalysisResult {
  alignmentId: string;
  totalLengthMeters: number;
  totalInputCrashes: number;
  projectedInsideBufferCount: number;
  projectedOutsideBufferCount: number;
  projectedCrashes: ProjectedCrash[];
  bins: LrsBinAggregate[];
  executionTimeMs: number;
}
```

---

## 3. Formulación Matemática de la Proyección Ortogonal

Dado un siniestro en la posición geográfica $P = (\lambda_P, \phi_P)$ y un segmento de alineamiento $AB$ con extremos $A = (\lambda_A, \phi_A)$ y $B = (\lambda_B, \phi_B)$:

```
           P (Siniestro)
          /|
         / | D_perp
        /  |
       A---P'---------B (Segmento Vial)
       |<->|
       t * ||AB||
```

### 3.1 Proyección en Coordenadas Cartesianas Locales

Para distancias locales de carretera (típicamente segmentos de $10\text{ m}$ a $2,000\text{ m}$), se realiza una transformación a espacio cartesiano métrico local centrado en el vértice $A$:

$$x_P = (\lambda_P - \lambda_A) \cdot \frac{\pi}{180} \cdot R_E \cdot \cos\left(\frac{\phi_A + \phi_P}{2} \cdot \frac{\pi}{180}\right)$$
$$y_P = (\phi_P - \phi_A) \cdot \frac{\pi}{180} \cdot R_E$$

Análogamente para el vértice $B$:
$$u_x = (\lambda_B - \lambda_A) \cdot \frac{\pi}{180} \cdot R_E \cdot \cos\left(\frac{\phi_A + \phi_B}{2} \cdot \frac{\pi}{180}\right)$$
$$u_y = (\phi_B - \phi_A) \cdot \frac{\pi}{180} \cdot R_E$$

El vector director del segmento es $\vec{u} = (u_x, u_y)$ y el vector desde el origen $A$ hacia el siniestro es $\vec{v} = (x_P, y_P)$.

### 3.2 Parámetro de Proyección Escalar ($t$) y Fijación (Clamping)

El parámetro escalar adimensional $t$ se determina mediante el producto escalar:

$$t = \frac{\vec{v} \cdot \vec{u}}{\|\vec{u}\|^2} = \frac{x_P u_x + y_P u_y}{u_x^2 + u_y^2}$$

El parámetro proyectado efectivo $t^*$ se acota al intervalo $[0, 1]$ del segmento:

$$t^* = \max(0, \min(1, t))$$

Las coordenadas del pie de la perpendicular proyectada $P'$ en el espacio local son:
$$\vec{P'} = t^* \cdot \vec{u}$$

Y su posición en coordenadas geográficas $(\lambda_{P'}, \phi_{P'})$ se obtiene por interpolación geodésica entre $A$ y $B$.

### 3.3 Distancia Ortogonal ($D_{\perp}$) y Determinación de Margen (Lado de Vía)

La distancia lateral u ortogonal no firmada es la distancia euclidiana en el plano local métrico:
$$D_{\perp} = \|\vec{v} - \vec{P'}\| = \sqrt{(x_P - P'_x)^2 + (y_P - P'_y)^2}$$

El lado de la vía respecto al sentido de circulación del alineamiento se deduce del producto vectorial en 2D (determinante):

$$\text{cross} = u_x \cdot y_P - u_y \cdot x_P$$

$$\text{signedLateralDistance} = \begin{cases}
+D_{\perp} & \text{si } \text{cross} < 0 \text{ (Margen Derecha)} \\
-D_{\perp} & \text{si } \text{cross} > 0 \text{ (Margen Izquierda)} \\
0 & \text{si } D_{\perp} \le 0.05\text{ m (Eje Central)}
\end{cases}$$

### 3.4 Cadenamiento Longitudinal ($S_i$)

Si el segmento $k$ comienza en la distancia acumulada $C_k$, la progresiva métrica de $P$ es:

$$S_i = C_k + t^* \cdot L_k$$

Donde $L_k$ es la longitud geodésica del segmento $AB$.

---

## 4. Resolución de Ambigüedades en Curvas y Vértices Agudos

Cuando un punto $P$ se ubica cerca del vértice común entre dos segmentos contiguos $S_1 = (A, B)$ y $S_2 = (B, C)$ o en curvas cerradas:

```mermaid
flowchart TD
    A[Siniestro P] --> B[Filtrado previo por Bounding Box R-Tree]
    B --> C[Evaluar proyección contra segmentos candidatos]
    C --> D[Calcular distancia ortogonal mínima |D_perp|]
    D --> E{¿Múltiples segmentos con igual |D_perp|?}
    E -->|No| F[Seleccionar segmento con menor |D_perp|]
    E -->|Sí| G[Criterio de desempate: Elegir segmento con proyección interna t en 0..1]
    G --> H{¿Aún empate?}
    H -->|Sí| I[Elegir segmento aguas arriba menor cadena S]
    H -->|No| F
```

1. **Minimización de Distancia:** Se proyecta el punto contra todos los segmentos del eje cuyos bounding boxes ampliados intersecan el punto. Se elige el segmento que minimiza la distancia lateral $|D_{\perp}|$.
2. **Preferencia de Proyección Ortogonal Real:** Entre un segmento con proyección en el vértice extremo ($t^* = 0$ o $t^* = 1$) y un segmento con proyección perpendicular interna ($0 < t^* < 1$), se prioriza la perpendicular interna si la diferencia de distancia es menor a $0.5\text{ m}$.
3. **Desempate Determinista:** Si la distancia es estrictamente idéntica, se asigna al segmento con menor índice de inicio (aguas arriba).

---

## 5. Filtrado por Buffer Paramétrico

Un siniestro proyectado se considera **dentro de la faja de análisis** (`isInsideBuffer = true`) si y solo si:
1. Su distancia ortogonal absoluta es menor o igual al umbral fijado por el usuario:
   $$|D_{\perp i}| \le W_{\text{buffer}}$$
2. Si el punto proyectó en los extremos terminales ($t^*=0$ en el primer vértice o $t^*=1$ en el último vértice del alineamiento general), la distancia longitudinal fuera del eje no excede $W_{\text{buffer}}$.

Los siniestros donde `isInsideBuffer = false` se conservan en la estructura de salida para fines de auditoría, pero se excluyen del cómputo de histogramas y del perfil longitudinal.

---

## 6. Algoritmo de Segmentación Homogénea (Binning) y Severidad

Dado el intervalo métrico $\Delta S$ (ej. $100\text{ m}$):
- Número de bins completos: $M = \lfloor L_{\text{total}} / \Delta S \rfloor$.
- Rango de cada bin $k \in [0, M-1]$:
  $$\text{Bin}_k = [k \cdot \Delta S,\ (k+1) \cdot \Delta S)$$
- Último bin residual $M$: $[M \cdot \Delta S, L_{\text{total}}]$.

### 6.1 Índice de Severidad Ponderada (EPDO - Equivalent Property Damage Only)
Siguiendo las pautas metodológicas de Auditoría de Seguridad Vial del MTC de Perú:

$$\text{EPDO}_k = w_F \cdot N_{\text{Fatal}, k} + w_G \cdot N_{\text{Grave}, k} + w_L \cdot N_{\text{Leve}, k} + w_D \cdot N_{\text{Solo Daños}, k}$$

Pesos por defecto calibrados:
- $w_F = 9.5$ (Fallecido)
- $w_G = 3.5$ (Lesiones Graves)
- $w_L = 1.0$ (Lesiones Leves)
- $w_D = 1.0$ (Solo Daños Materiales)

---

## 7. Rendimiento y Criterios de Aceptación (DoD)

### 7.1 Presupuesto de Rendimiento
- Proyección y binning de $10,000$ siniestros sobre un eje de $50\text{ km}$ ($500$ vértices) $\le 45\text{ ms}$.
- Recálculo reactivo al modificar el buffer mediante slider $\le 25\text{ ms}$.

### 7.2 Casos de Prueba Sintéticos (Unit Tests)

#### Test Case 3.1: Proyección Exacta sobre el Eje
- **Given:** Eje recto de $(0, 0)$ a $(0, 1)$ ($111.3\text{ km}$ aprox). Siniestro en $(0, 0.5)$.
- **When:** Se ejecuta el motor LRS.
- **Then:**
  - `lateralDistanceMeters` $\le 0.05\text{ m}$.
  - `side` == `RoadSide.CENTER`.
  - `chainageMeters` debe ser aproximadamente $0.5 \cdot L_{\text{total}}$.
  - `isInsideBuffer` == `true`.

#### Test Case 3.2: Detección de Margen Izquierda y Derecha
- **Given:** Eje que avanza de Sur a Norte. Punto $P_1$ desplazado $15\text{ m}$ al Este y Punto $P_2$ desplazado $15\text{ m}$ al Oeste.
- **When:** Se ejecuta la proyección LRS.
- **Then:**
  - $P_1.\text{side} == \text{RoadSide.RIGHT}$ y $P_1.\text{signedLateralDistanceMeters} \approx +15.0\text{ m}$.
  - $P_2.\text{side} == \text{RoadSide.LEFT}$ y $P_2.\text{signedLateralDistanceMeters} \approx -15.0\text{ m}$.

#### Test Case 3.3: Exclusión por Umbral de Buffer
- **Given:** Buffer fijado en $20\text{ m}$. Punto $P$ ubicado a $35\text{ m}$ del eje.
- **When:** Se evalúa el punto.
- **Then:** `isInsideBuffer` debe ser `false`; el punto no suma en ningún conteo de `LrsBinAggregate`.

#### Test Case 3.4: Cálculo de Ponderación EPDO
- **Given:** Un bin con 1 fallecido, 2 heridos graves y 3 solo daños materiales.
- **When:** Se computa `epdoScore` con pesos por defecto.
- **Then:** $\text{EPDO} = 1 \cdot 9.5 + 2 \cdot 3.5 + 0 \cdot 1.0 + 3 \cdot 1.0 = 9.5 + 7.0 + 3.0 = 19.5$.
