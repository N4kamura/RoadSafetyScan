# Tareas de Implementación - SPEC-35: Despeje Geométrico Anti-Superposición y Escalamiento Dinámico por Zoom

- [x] **TASK-35.1: Modelo Geométrico Anti-Superposición en `generator.ts`**
  - Calcular $d_{\text{bulge, max}} = \max(0, \max d_{\text{lateral}}(s))$ en `buildRectilinearBaselineProfile`.
  - Aplicar $D_{\text{clearance}} = d_{\text{bulge, max}} + D_{\text{offset}}$ garantizando separación neta $\ge D_{\text{offset}}$.
  - Mantener curvatura terminal cóncava ($C^1$) sin estiramiento tangencial de barras.

- [x] **TASK-35.2: Escalamiento Adaptativo de Separación Lateral en `map-view.ts`**
  - Implementar método `getEffectiveCurvilinearOffset()`.
  - Aplicar `computeZoomScaleFactor(zoom, 13.0, 0.70, 5.0)`.
  - Usar offset efectivo en generación de perfil, puntero y handle de escala.

- [x] **TASK-35.3: Ampliación de Controles en la UI (`index.html`)**
  - Incrementar rango del slider `slider-curv-offset` a $400\text{ m} - 8,000\text{ m}$.
  - Actualizar pastillas rápidas flotantes a $800\text{ m}$, $1.5\text{ km}$, $3\text{ km}$ y $5\text{ km}$.

- [x] **TASK-35.4: Pruebas Unitarias Automatizadas (Vitest)**
  - Crear `tests/unit/curvilinear/anti-overlap-zoom-offset.test.ts`.
  - Validar no superposición en trazado curvo pronunciado (flecha $> 2,000\text{ m}$).
  - Validar escalamiento adaptativo de offset por zoom.
  - Ejecutar suite de pruebas completa y verificar 100% de éxito.
