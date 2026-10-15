# SPEC-33: Alineación de Controles Duales y Seguimiento Automático a la Mira del Viewport (Aligned Dual Controls & Viewport Sight Tracking)

## 1. Estado y Metadatos
- **ID:** SPEC-33
- **Título:** Alineación de Controles Duales y Seguimiento Automático a la Mira del Viewport
- **Módulo:** `ui/map-view`, `pkg/curvilinear/pointer`, `ui`
- **Estado:** `IMPLEMENTED` (100% Tests Pass)
- **Referencias Visuales:**
  - Control Dual Alineado en Galería VisQuill: `C:/Users/W11/.gemini/antigravity/brain/36bd6bb5-e6ba-4b2f-80dd-f10da79c3b09/.user_uploaded/media_1792018894310_93c77c02.png`
  - Controles en Zoom Local (Newcastle upon Tyne): `C:/Users/W11/.gemini/antigravity/brain/36bd6bb5-e6ba-4b2f-80dd-f10da79c3b09/.user_uploaded/media_1792016349934_97245bb0.png`
- **Especificaciones Relacionadas:**
  - SPEC-11 (Puntero Interactivo Bidireccional)
  - SPEC-12 (Asa Interactiva de Escala de Barras)
  - SPEC-26 (Constreñimiento 1D del Puntero)
  - SPEC-28 (Grilla de 4 Escalas Concéntricas y Handle Confinado)
  - SPEC-31 (Línea Base Rectilínea Macro-Simplificada)
  - SPEC-32 (Línea Base Global Estable y Garantía Antigiro)

---

## 2. Contexto y Diagnóstico del Problema

### 2.1 Necesidad del Usuario
El usuario ha detectado dos comportamientos deficientes en la experiencia de interacción con los controles en pantalla:
1. **Pérdida de Botones fuera de la Pantalla:**
   - Previamente, la progresiva del puntero y del botón de escala (`currentPointerChainage`) se fijaba una sola vez al cargar la ruta (ej. en el 35% de la longitud total).
   - Cuando el usuario navegaba, se desplazaba (*pan*) o hacía zoom para inspeccionar un tramo específico en otro kilómetro de la carretera, los botones quedaban anclados en su posición original, desapareciendo por completo del campo visual del usuario.
2. **Alineación Obligatoria de Ambos Controles:**
   - En el modelo original de VisQuill, el **botón semicircular** (puntero de progresiva sobre la baseline) y el **botón rectangular** (control deslizable de escala sobre la grilla) operan como un único bloque funcional alineado coaxialmente sobre el mismo rayo normal transversal de la cuadrícula.
   - Ambos controles deben estar siempre alineados de forma vertical/normal entre sí y deben **moverse dinámicamente con la mira del usuario en el mapa** ("donde yo comience a ver, deben moverse los dos botones").

---

## 3. Requisitos Técnicos y Modelo de Interacción

### 3.1 Requisito 33.1: Alineación Coaxial Estricta de Controles
1. Ambos botones se evalúan siempre en la **misma progresiva vial $s$**:
   - **Botón Semicircular (Puntero):**
     $$P_{\text{pointer}} = B(s)$$
     con rotación plana $\theta_B(s)$ tangente a la línea base.
   - **Botón Rectangular (Handle de Escala):**
     $$P_{\text{scale}} = \text{offsetCoordinate}(B(s), \vec{n}_B(s), D_{\text{grid\_level}})$$
     con rotación plana idéntica $\theta_B(s)$, manteniéndose perfectamente alineado sobre el rayo normal transversal de la grilla.
2. Al arrastrar el botón semicircular a lo largo de la línea base, el botón de escala lo acompaña rígidamente a lo largo de la trayectoria.
3. Al arrastrar el botón rectangular a lo largo de la normal transversal para ajustar la escala de las barras, el botón semicircular se mantiene como su pivote base anclado a la línea base.

### 3.2 Requisito 33.2: Seguimiento Automático a la Mira del Viewport (Sight Tracking)
1. Durante la exploración del mapa (eventos `moveend`, `zoomend`, o cambio de ruta activa):
   - Si el usuario **no está arrastrando activamente** ninguno de los botones (`!isDraggingPointer && !isDraggingScaleHandle`):
   - Se determina el rango de progresivas visibles en el viewport actual $[S_{\text{view, min}}, S_{\text{view, max}}]$.
   - Se calcula la progresiva central correspondiente a la "mira" del usuario en pantalla:
     $$s_{\text{sight}} = \frac{S_{\text{view, min}} + S_{\text{view, max}}}{2}$$
   - Se actualiza `currentPointerChainage = s_sight`.
   - Se actualiza de inmediato la posición geográfica y orientación de ambos marcadores en el mapa (`updatePointerVisuals()`).
2. **Resultado Inmediato:** En cualquier punto de la carretera al que el usuario decida desplazarse, los dos botones aparecen de forma automática centrados en su pantalla, alineados entre sí y listos para interactuar.

---

## 4. Criterios de Aceptación (Test-Driven Acceptance Criteria)

- **Test Case 33.1 (Alineación Coaxial de Botones):**
  Para cualquier progresiva $s$, el vector que une la posición del botón semicircular $P_{\text{pointer}}$ con la del botón rectangular $P_{\text{scale}}$ es colineal con el vector normal $\vec{n}_B(s)$ de la línea base (desviación angular $< 0.1^\circ$).
- **Test Case 33.2 (Seguimiento Automático al Centro del Viewport):**
  Al cambiar el rango de progresivas visibles del mapa a $[S_A, S_B]$ sin arrastre manual activo, la progresiva activa de los botones se sitúa en el punto medio $(S_A + S_B) / 2$.
- **Test Case 33.3 (Suspensión de Seguimiento durante Arrastre Manual):**
  Mientras el usuario mantiene presionado y arrastra cualquiera de los dos botones (`isDraggingPointer = true` o `isDraggingScaleHandle = true`), el seguimiento automático queda inactivo para respetar la interacción directa del cursor.

---

## 5. Trazabilidad
- `src/ui/map-view.ts`: Integración del listener de seguimiento a la mira en `moveend` y sincronización coaxial de marcadores.
- `src/pkg/curvilinear/pointer.ts`: Garantía de coherencia matemática en `computePointerGeometry` y `computeScaleHandleCoordinate`.
- `tests/unit/curvilinear/aligned-controls-sight-tracking.test.ts`: Batería de pruebas unitarias para SPEC-33.
