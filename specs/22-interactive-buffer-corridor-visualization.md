# SPEC-22: Visualización Cartográfica Dinámica de la Faja de Influencia (Buffer Vial Interactivo)

- **ID:** SPEC-22
- **Módulo:** `pkg/tracer`, `ui/map-view`
- **Estado:** `APPROVED` (Listo para implementación)
- **Trazabilidad:** [Constitution - Principle 3 & Module 3](file:///d:/Projects/RoadSafetyScan/constitution.md), [SPEC-03](file:///d:/Projects/RoadSafetyScan/specs/03-lrs-projection-engine.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Necesidad Visual
El motor LRS utiliza un parámetro crítico denominado **Ancho de Faja de Influencia** ($W_{\text{buffer}}$, por defecto $25\text{ m}$), el cual define el umbral transversal máximo para que un siniestro sea considerado dentro del corredor vial analizado:
$$|D_{\perp i}| \le W_{\text{buffer}}$$

Actualmente, el usuario puede manipular el deslizador métrico en la barra lateral (de $5\text{ m}$ a $100\text{ m}$), pero no cuenta con retroalimentación visual sobre el mapa que le muestre el área física abarcada por dicha faja.

### 1.2 Objetivo
Proporcionar una visualización cartográfica tenue, elegante y reactiva del corredor de influencia vial:
1. Renderizar un polígono cerrado continuo alrededor del eje vial con un semiancho igual a $W_{\text{buffer}}$ a ambos márgenes (ancho total $2 \cdot W_{\text{buffer}}$).
2. Estilo visual:
   - Relleno semitransparente tenue (`fill-opacity: 0.12`).
   - Borde discontinuo sutil (`line-width: 1.5px`, `line-dasharray: [3, 2]`).
3. Reactividad en tiempo real: al arrastrar el control deslizante de ancho de buffer, el polígono debe ensancharse o encogerse fluidamente a 60 FPS sin retraso perceptible.
4. Ocultarse limpiamente cuando no exista una ruta vial seleccionada.

---

## 2. Modelo Geométrico del Polígono de Buffer

Dado el alineamiento $T(s)$ parametrizado de $s = 0$ a $s = L_{\text{total}}$, con normales unitarias $\vec{n}(s)$:

1. **Margen Izquierdo:** Puntos desplazados a $-W_{\text{buffer}} \cdot \vec{n}(s)$ muestreados en sentido creciente de progresiva ($0 \to L_{\text{total}}$).
2. **Cierre Terminal (Tapa Semicircular):** Arco geodésico de 8 puntos en torno al vértice final desde $-W_{\text{buffer}}$ hasta $+W_{\text{buffer}}$.
3. **Margen Derecho:** Puntos desplazados a $+W_{\text{buffer}} \cdot \vec{n}(s)$ recorridos en sentido decreciente de progresiva ($L_{\text{total}} \to 0$).
4. **Cierre Inicial (Tapa Semicircular):** Arco geodésico de 8 puntos en torno al vértice inicial desde $+W_{\text{buffer}}$ hasta $-W_{\text{buffer}}$.
5. Polígono cerrado conforme al estándar GeoJSON RFC 7946.

---

## 3. Criterios de Aceptación (DoD)

1. El buffer se dibuja como un polígono cerrado en la capa `layer-buffer-fill` y `layer-buffer-line`.
2. Al deslizar el control métrico en la barra lateral, el polígono se actualiza reactivamente.
3. El estilo visual es tenue y no satura ni oculta las barras curvilíneas ni los puntos de siniestro.
4. Cobertura de pruebas unitarias sobre el generador geodésico del polígono de buffer.
