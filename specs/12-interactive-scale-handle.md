# SPEC-12: Botón Rectangular Desplazable de Ajuste Dinámico de Escala de Barras

- **ID:** SPEC-12
- **Módulo:** `pkg/curvilinear` & `ui/map-view`
- **Estado:** `COMPLETADO (IMPLEMENTED)`
- **Trazabilidad:** [Constitution - Principle 4 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md#L29-L33)
- **Especificaciones Relacionadas:** [SPEC-06](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md), [SPEC-09](file:///d:/Projects/RoadSafetyScan/specs/09-zoom-limits-and-autoscale.md), [SPEC-11](file:///d:/Projects/RoadSafetyScan/specs/11-interactive-chainage-pointer.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Necesidad del Usuario
En la inspección analítica del perfil curvilíneo ("Profiles along a line"), el usuario necesita ajustar la magnitud y altura visual de las barras directamente sobre el lienzo cartográfico sin tener que desplazarse al panel lateral de configuración.

El usuario requiere que:
> *"Del Spec 11, hay otro botón que es un rectángulo, este se encuentra en la grilla de la barra, a la misma altura que el botón anterior del Spec 11. Ese botón se desplaza verticalmente en el mismo sentido de las barras y permite modificar la escala de las barras. Si lo alejo de la parte inferior la escala disminuye y por lo tanto las barras se agrandan, sin embargo, si lo acerco a la parte inferior, la escala crece y por lo tanto las barras se achican. Esto tiene un límite, te lo dejo a tu criterio ese límite, para que no se agrande o empequeñe de manera desorbitada."*

---

## 2. Requisitos Técnicos y Criterios de Aceptación

### 2.1 Requisito 12.1: Botón Rectangular en la Grilla de las Barras
- Se posiciona un botón rectangular negro interactivo sobre la grilla transversal del perfil curvilíneo.
- Su posición longitudinal se encuentra a la misma progresiva vial $s$ que el botón semicircular de SPEC-11.
- Forma y apariencia visual idéntica a la imagen de referencia:
  - Rectángulo negro (`#0F172A`) con esquinas ligeramente redondeadas (border-radius 4px).
  - Tres ranuras blancas horizontales paralelas de agarre (`≡`).
  - Orientado con su eje longitudinal alineado al sentido de extrusión de las barras.
- Cuando el botón semicircular de SPEC-11 se desplaza a lo largo del eje, el botón rectangular se traslada simultáneamente manteniendo la misma progresiva $s$.

### 2.2 Requisito 12.2: Desplazamiento Transversal y Modificación de Escala
- El botón rectangular se desplaza a lo largo de la dirección transversal normal $\vec{n}(s)$ de las barras:
  - **Alejamiento de la línea base (hacia afuera):** La altura visual de las barras se agranda (mayor escala de extrusión en metros por unidad).
  - **Acercamiento a la línea base (hacia adentro):** La altura visual de las barras se achica (menor escala de extrusión en metros por unidad).
- Rango de escala acotado para evitar distorsiones visuales desorbitadas:
  $$S_{\text{min}} = 10\text{ m/u} \le S \le S_{\text{max}} = 120\text{ m/u}$$
  con valor por defecto calibrado de $40\text{ m/u}$.

### 2.3 Requisito 12.3: Reactividad Bidireccional
- Al arrastrar el botón rectangular, se actualiza el store reactivo `VizStore` (`config.curvilinearHeightScale`).
- El perfil curvilíneo completo (barras, isolíneas concéntricas y etiquetas de ticks) se recalcula y re-extruye en tiempo real.
- El control de rango numérico en la barra lateral (`#slider-curv-scale` y `#val-curv-scale`) se mantiene en sincronía automática.

### 2.4 Requisito 12.4: Criterios de Aceptación (DoD)
1. Tests unitarios en `tests/unit/curvilinear/scale-handle.test.ts` verifican:
   - Cálculo de posición del handle rectangular a lo largo de la normal a progresiva $s$.
   - Conversión de distancia transversal a factor de escala dentro de los límites $[10, 120]\text{ m/u}$.
2. En la interfaz web, el botón rectangular aparece sobre la grilla de las barras a la misma altura que el botón semicircular.
3. Arrastrar el botón verticalmente agranda o reduce fluidamente la escala de las barras.
4. 100% de tests pasando en `npm test`.
