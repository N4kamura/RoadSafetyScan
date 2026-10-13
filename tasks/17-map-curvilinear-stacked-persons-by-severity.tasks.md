# Tareas de Implementación: SPEC-17 (Barras Curvilíneas Apiladas por Gravedad de Personas)

- **Especificación:** [`specs/17-map-curvilinear-stacked-persons-by-severity.md`](file:///d:/Projects/RoadSafetyScan/specs/17-map-curvilinear-stacked-persons-by-severity.md)
- **Módulos:** `pkg/curvilinear`, `ui/map-view`
- **Estado:** `COMPLETADO (IMPLEMENTED)`

---

## Tareas Técnicas Detalladas

### Fase 17.1: Extensión del Modelo y Generador Curvilíneo
- [x] **TASK-17.1.1:** Extender `CurvilinearBarFeature` en `src/pkg/curvilinear/types.ts` con propiedades `fillColor`, `subCategory` y `subCount`.
- [x] **TASK-17.1.2:** Modificar `generateCurvilinearProfile` en `src/pkg/curvilinear/generator.ts` para extruir sub-polígonos apilados ortogonalmente cuando `opts.metricMode === 'PERSONS'`.
- [x] **TASK-17.1.3:** Asignar los colores correspondientes por severidad (`#DC2626` Fallecido, `#EA580C` Lesionado, `#94A3B8` No se conoce, `#10B981` Ileso).

### Fase 17.2: Adaptación de Capas MapLibre y Tooltips
- [x] **TASK-17.2.1:** Actualizar `buildCurvilinearMapLibreLayers` en `src/pkg/curvilinear/maplibre-layers.ts` para utilizar `bar.fillColor` directamente si está presente.
- [x] **TASK-17.2.2:** Asegurar que en el evento `mousemove` en `src/ui/map-view.ts`, el tooltip desglosa el conteo de personas por gravedad (fallecido, lesionado, no se conoce, ileso).

### Fase 17.3: Verificación y Tests Unitarios
- [x] **TASK-17.3.1:** Crear tests unitarios en `tests/unit/curvilinear/stacked-bars.test.ts` verificando la generación de sub-polígonos apilados y la preservación de la altura acumulada total.
- [x] **TASK-17.3.2:** Ejecutar suite completa con `npm test` (90 tests pasando) y verificar compilación con `npm run build`.
