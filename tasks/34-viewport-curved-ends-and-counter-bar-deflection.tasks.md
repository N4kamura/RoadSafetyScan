# Tareas de Implementación - SPEC-34: Bordes Curvos Invariables hacia el Lado Opuesto de las Barras en Cualquier Zoom

- [x] **TASK-34.1: Modelo Geométrico y Parametrización de Bordes Curvos**
  - Implementar cálculo de $\tau \in [0, 1]$ normalizado al rango visible $[s_{\min}, s_{\max}]$.
  - Definir deflexión en contra de las barras ($D(s) = D_{\text{offset}} - w \cdot 0.45 \cdot D_{\text{offset}}$) hacia la carretera en ambos extremos.
  - Orientar rotación tangencial de normales ($\vec{N}_{\text{out}} \pm w \cdot 0.65 \cdot \vec{T}$) para formar arcos concéntricos en isolíneas.

- [x] **TASK-34.2: Actualización de `buildRectilinearBaselineProfile` en `generator.ts`**
  - Modificar `buildRectilinearBaselineProfile` en `src/pkg/curvilinear/generator.ts`.
  - Asegurar mantenimiento de cuerpo central rectilíneo y ortogonal.
  - Garantizar proximidad precisa a la carretera para evitar desfase en el puntero semicircular.

- [x] **TASK-34.3: Pruebas Unitarias Automatizadas (Vitest)**
  - Crear `tests/unit/curvilinear/viewport-curved-ends.test.ts`.
  - Validar curvatura cóncava hacia el eje vial en ambos extremos tanto en zoom macro como en zoom local.
  - Validar colinealidad estricta y normal constante en el cuerpo central.
  - Validar alineación continua y distancia controlada del puntero y botón de escala.
  - Ejecutar suite de pruebas completa y verificar 100% de éxito.
