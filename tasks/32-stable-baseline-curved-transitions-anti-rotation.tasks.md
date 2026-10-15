# Plan de Tareas: SPEC-32 — Línea Base Global Estable con Bordes Curvos y Garantía Antigiro

Este plan define las tareas ejecutables bajo TDD para garantizar la estabilidad absoluta (sin rotación en pan/zoom) de la línea base y la curvatura suave en los extremos del corredor.

---

## Tareas

- [x] `TASK-32.1`: Implementar en `src/pkg/curvilinear/generator.ts` el cálculo de la línea base global invariable anclada a la geometría de la carretera (`buildGlobalStableBaselineProfile`), integrando transición armónica hacia arcos curvos en los extremos terminales ($s < 0.15 L$ y $s > 0.85 L$) y tramo rectilíneo en el cuerpo principal.
- [x] `TASK-32.2`: Modificar `generateCurvilinearProfile` para reutilizar o extraer sub-segmentos de la línea base global sin reorientar el vector secante cuando se aplique `visibleRange` (garantía antigiro estricta en pan/zoom).
- [x] `TASK-32.3`: Crear suite de pruebas unitarias en `tests/unit/curvilinear/stable-baseline-anti-rotation.test.ts` verificando:
  - Invarianza angular absoluta ($0.0^\circ$ de giro) al desplazar el viewport.
  - Curvatura suave y continua ($C^1$) en los bordes terminales.
  - Tramo central estrictamente rectilíneo con barras paralelas.
- [x] `TASK-32.4`: Validar con `npm test` (151 tests pasando) y compilación de producción con Vite.
