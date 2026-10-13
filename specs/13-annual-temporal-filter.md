# SPEC-13: Filtro Temporal por Años de Siniestros Viales en el Panel Lateral

- **ID:** SPEC-13
- **Módulo:** `pkg/viz` & `ui/sidebar`
- **Estado:** `COMPLETADO (IMPLEMENTED)`
- **Trazabilidad:** [Constitution - Principle 3 & Module 3](file:///d:/Projects/RoadSafetyScan/constitution.md)
- **Especificaciones Relacionadas:** [SPEC-03](file:///d:/Projects/RoadSafetyScan/specs/03-lrs-projection-engine.md), [SPEC-04](file:///d:/Projects/RoadSafetyScan/specs/04-reactive-visualization-profiler.md), [SPEC-06](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md), [SPEC-10](file:///d:/Projects/RoadSafetyScan/specs/10-circular-time-range-clock.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Necesidad del Usuario
En la auditoría y análisis de seguridad vial (DG-2018 MTC Perú), los siniestros se recopilan a lo largo de series históricas multianuales (ej. 2021-2024). Los auditores e ingenieros de transporte necesitan aislar años específicos o comparar periodos anuales directamente desde el panel lateral, filtrando automáticamente tanto los puntos en el mapa como los perfiles de densidad curvilínea y los indicadores clave de desempeño (KPIs).

El usuario requiere:
> *"Agrega un Spec nuevo, Spec 13 sería. Necesito que en la parte del panel lateral, yo pueda escoger los años de los accidentes y se filtre automáticamente."*

---

## 2. Requisitos Técnicos y Criterios de Aceptación

### 2.1 Requisito 13.1: Modelo de Estado y Extracción de Años
- `FilterState` en `src/pkg/viz/types.ts` debe soportar la propiedad opcional:
  ```typescript
  selectedYears?: number[];
  ```
- El store reactivo `VizStore` debe proveer el método `getAvailableYears(): number[]` que descubra de manera dinámica y devuelva en orden cronológico descendente los años únicos presentes en el conjunto de siniestros cargado (`allCrashes`), inspeccionando `crash.year` o extrayendo el año UTC de `crash.timestamp`.
- Si `selectedYears` no está definido o está vacío, no se aplica restricción por año (se incluyen todos los años disponibles).
- Si `selectedYears` contiene una lista de años (ej. `[2024]` o `[2022, 2023]`), solo se incluyen en `filteredCrashes` los siniestros cuyo año pertenezca al conjunto seleccionado.

### 2.2 Requisito 13.2: Componente Interactivo en el Panel Lateral
- Se incorpora en la barra lateral izquierda una sección dedicada: **"Años de Siniestros"**.
- Debe incluir:
  - Una insignia de conteo de años activos (ej. *"4/4 años"* o *"1/4 años"*).
  - Botones de acción rápida:
    - **"Todos":** Selecciona todos los años disponibles.
    - **"Último Año" (ej. 2024):** Selecciona únicamente el año más reciente.
    - **"Limpiar":** Deselecciona todos los años para aislar rápidamente un periodo.
  - Una grilla interactiva de casillas o chips para cada año descubierto en los datos (ej. `2024`, `2023`, `2022`, `2021`), mostrando el año y la cantidad total de siniestros de dicho año.

### 2.3 Requisito 13.3: Filtrado Reactivo y Recálculo Automático
- La selección o deselección de cualquier año debe desencadenar instantáneamente el recálculo en `VizStore`:
  1. `filteredCrashes` se filtra inmediatamente.
  2. El motor LRS (`analyzeLrs`) proyecta ortogonalmente y re-segmenta en bins de acuerdo a los siniestros filtrados.
  3. El perfil curvilíneo paralelo (VisQuill A1 Density / EPDO) se redibuja en el mapa cartográfico.
  4. Los puntos individuales de siniestros (visibles en zoom $\ge 13.5$) se actualizan en el mapa.
  5. Los paneles KPI (Siniestros en Faja, Fuera de Buffer, EPDO Acumulado y Hotspot Crítico) se actualizan en tiempo real.
  6. El perfil longitudinal inferior se actualiza para reflejar únicamente los siniestros de los años seleccionados.

### 2.4 Requisito 13.4: Interoperabilidad Ortogonal con Otros Filtros
- El filtro anual debe componerse mediante una conjunción lógica (AND) con:
  - El filtro de severidad (Fatal, Graves, Leves, Daños).
  - El filtro horario del reloj circular dinámico de 24 horas (SPEC-10).

### 2.5 Requisito 13.5: Criterios de Aceptación (DoD)
1. **Tests Unitarios:** Suite en `tests/unit/viz/year-filter.test.ts` con cobertura del 100% para extracción de años, filtrado individual, multifiltro y combinación con otros criterios.
2. **Interfaz de Usuario:** Controles de año renderizados y operativos en el panel lateral.
3. **Distribución en Mock Data:** `MOCK_CRASHES_DATA` incluye siniestros distribuidos en los años 2021, 2022, 2023 y 2024 para una validación interactiva completa.
4. **100% Tests Pasando:** `npm test` aprueba todas las pruebas de la suite sin regresiones.
5. **Git:** Cambios versionados y registrados en el repositorio local.
