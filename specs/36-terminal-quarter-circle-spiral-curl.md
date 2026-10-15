# SPEC-36: Remates Terminales en Espiral / Cuarto de Circunferencia hacia el Trazo Vial

## 1. Contexto y Justificación Visual
En la versión previa (SPEC-34 y SPEC-35), los extremos de la línea base rectilínea aplicaban una reducción de offset escalar a lo largo de las progresivas lineales de la secante, lo cual producía un leve "pandeo" sin girar la trayectoria hacia la carretera.
El usuario ha aportado una referencia gráfica explícita (`media_1792025675094_26901e6b.png`) donde se traza una línea verde demostrando el comportamiento esperado:
- La línea base debe ser recta a lo largo del cuerpo central del tramo visible.
- En ambos extremos (inicio y fin), la línea base debe curvarse de forma continua ($C^1$) describiendo un **cuarto de circunferencia (o arco espiral)** que gira su vector tangente directamente **hacia el trazo vial** (lado opuesto de las barras, es decir, en sentido $-\vec{n}_{\text{outward}}$).
- En el extremo superior (fin del tramo), la curva dobla hacia el eje vial (izquierda si el perfil está a la derecha).
- En el extremo inferior (inicio del tramo), la curva dobla simétricamente hacia el eje vial.

```
       [Fin: Giro ~80-90° hacia la carretera]
                 ╭───────── (Línea verde del usuario: arco hacia el camino)
                │
                │  <-- Cuerpo central rectilíneo estable
                │      (barras extruidas ortogonalmente hacia afuera)
                │
                 ╰───────── [Inicio: Giro ~80-90° hacia la carretera]
```

---

## 2. Modelo Matemático y Parametrización Geométrica

### 2.1 Definición de la Secante y Marco de Referencia
Sean $P_{\text{start}}$ y $P_{\text{end}}$ los puntos de anclaje de la secante para el tramo visible $[s_{\text{min}}, s_{\text{max}}]$, con vector tangente unitario $\vec{t}$ y vector normal exterior $\vec{n}_{\text{outward}}$.
El offset efectivo con despeje anti-superposición es:
$$D_{\text{eff}} = D_{\text{offset}} + d_{\text{bulge, max}}$$

La línea base no perturbada en el espacio euclidiano local se define sobre el cuerpo rectilíneo:
$$B_0(\tau) = P_{\text{spine}}(\tau) + D_{\text{eff}} \cdot \vec{n}_{\text{outward}}$$
donde $\tau = \frac{s - s_{\text{min}}}{s_{\text{max}} - s_{\text{min}}} \in [0, 1]$.

### 2.2 Transición Terminal en Espiral con Radio de Curvatura Amplio
Se define una región de remate en los bordes con un ratio de transición $\rho = \text{borderCurvatureRatio}$ (típicamente $0.15$).
Para lograr una curva **plana, amplia y elegante** (evitando codos exagerados), se utiliza un **radio de curvatura amplio** y un **ángulo de deflexión moderado**:
$$R_{\text{curl}} = \min(D_{\text{eff}} \cdot 0.80, \text{span} \cdot 0.25)$$
El ángulo total de deflexión terminal se establece en $\theta_{\text{max}} \approx 45^\circ - 50^\circ$ ($\approx 0.84\text{ rad}$), produciendo un giro sutil y aerodinámico hacia el trazo vial.

#### A. Extremo Final ($\tau > 1 - \rho$):
Definiendo el progreso normalizado de salida $u \in [0, 1]$:
$$u = \frac{\tau - (1 - \rho)}{\rho}$$
Se aplica una función de curvatura suave tipo Hann / clotoide para que en $u=0$ la curvatura sea cero y la tangente sea estrictamente colineal con $\vec{t}$ ($C^1$ continuo):
$$\theta(u) = \theta_{\text{max}} \cdot \frac{1 - \cos(\pi u)}{2}$$
El desplazamiento del punto en el plano local combina avance tangencial y deflexión hacia el camino:
$$\Delta \vec{p}_{\text{end}}(u) = R_{\text{curl}} \left[ \sin(\theta(u)) \cdot \vec{t} - (1 - \cos(\theta(u))) \cdot \vec{n}_{\text{outward}} \right]$$
El punto final sobre la línea base se calcula aplicando esta deflexión a partir del punto de unión $B_0(1 - \rho)$:
$$B(\tau) = B_0(1 - \rho) + \Delta \vec{p}_{\text{end}}(u)$$
La tangente local rota $\theta(u)$ hacia adentro, y el vector normal de extrucción de barras se adapta suavemente acompañando la rotación de la línea base:
$$\vec{n}(u) = \cos(\theta(u)) \cdot \vec{n}_{\text{outward}} + \sin(\theta(u)) \cdot \vec{t}$$

#### B. Extremo Inicial ($\tau < \rho$):
Simétricamente, para el inicio $u = \frac{\rho - \tau}{\rho} \in [0, 1]$ (donde $u=0$ es la unión con la recta central y $u=1$ es el punto inicial de la línea base):
$$\theta(u) = \theta_{\text{max}} \cdot \frac{1 - \cos(\pi u)}{2}$$
El desplazamiento se orienta hacia atrás en tangente y hacia la carretera:
$$\Delta \vec{p}_{\text{start}}(u) = R_{\text{curl}} \left[ -\sin(\theta(u)) \cdot \vec{t} - (1 - \cos(\theta(u))) \cdot \vec{n}_{\text{outward}} \right]$$
$$B(\tau) = B_0(\rho) + \Delta \vec{p}_{\text{start}}(u)$$

---

## 3. Criterios de Aceptación y Casos de Prueba

1. **Giro Angular Terminal Verificado:**
   En los extremos terminales ($\tau=0$ y $\tau=1$), el vector tangente de la línea base debe formar un ángulo de al menos $60^\circ$ respecto a la secante central, apuntando en dirección hacia el eje vial ($-\vec{n}_{\text{outward}}$).
2. **Continuidad $C^1$ en la Unión:**
   En los puntos de empalme $\tau = \rho$ y $\tau = 1 - \rho$, la posición y el vector tangente deben coincidir con la recta central sin quiebres abruptos ni discontinuidades.
3. **Preservación del Despeje Anti-Superposición (SPEC-35):**
   Aun con el giro del cuarto de círculo hacia el camino, el radio $R_{\text{curl}}$ está acotado por $D_{\text{eff}} \cdot 0.55$, garantizando que el remate nunca cruce ni toque la calzada.
4. **Pruebas y Compatibilidad:**
   Todos los tests unitarios de mapeo de barras, puntero y escalamiento dinámico deben continuar aprobando al 100%.
