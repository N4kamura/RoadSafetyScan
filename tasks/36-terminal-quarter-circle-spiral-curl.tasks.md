# Tareas de Implementación - SPEC-36: Remates Terminales en Espiral / Cuarto de Circunferencia hacia el Trazo Vial

- [x] **TASK-36.1: Parametrización de Arco Terminal en `src/pkg/curvilinear/generator.ts`**
  - Implementar la deflexión en cuarto de circunferencia ($R_{\text{curl}}$, $\theta(u)$) en `buildRectilinearBaselineProfile`.
  - Asegurar transición $C^1$ suave y colineal en los puntos de unión con el cuerpo rectilíneo.
  - Asegurar giro angular $\Delta \theta \approx 75^\circ - 85^\circ$ apuntando hacia el eje vial.
  - Acotar el radio de giro a $R_{\text{curl}} \le D_{\text{eff}} \cdot 0.55$ para garantizar no superposición con la calzada.

- [x] **TASK-36.2: Verificación de Mapeo y Puntero en Extremos Curvos**
  - Comprobar que `sampleBaselineAtStation` recorre el perfil completo sin singularidades numéricas.
  - Comprobar alineación visual y vertical de los botones de control cuando el usuario navega hacia los extremos.

- [x] **TASK-36.3: Pruebas Unitarias Automatizadas (Vitest)**
  - Crear `tests/unit/curvilinear/terminal-spiral-curl.test.ts`.
  - Validar ángulo terminal $> 60^\circ$ hacia el trazo vial en $\tau=0$ y $\tau=1$.
  - Validar continuidad $C^1$ en los puntos de transición.
  - Ejecutar suite completa (`npm test`) y verificar compilación de producción (`npm run build`).
