# Tareas: SPEC-06 — Perfil Curvilíneo Paralelo al Trazo ("Profiles along a line")

- **Especificación:** [`specs/06-curvilinear-profile-along-line.md`](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md)
- **Módulo:** `pkg/curvilinear`
- **Estado:** `COMPLETED`
- **Referencia:** Galería VisQuill *A1 Collision Density*

---

## Desglose Detallado de Tareas

### Grupo 1: Geometría de Curvas Paralelas y Suavizado de Normales
- [x] `TASK-6.1.1`: Definir tipos en `src/pkg/curvilinear/types.ts`:
  - `CurvilinearProfileOptions` ($D_{\text{offset}}$, lado, escala, isolíneas).
  - `CurvilinearBarFeature` (polígonos de 4 vértices geográficos).
  - `CurvilinearIsolineFeature` (arcos concéntricos con valores).
  - `CurvilinearProfileModel` (modelo completo para renderizado).
- [x] `TASK-6.1.2`: Implementar cálculo de vectores normales y suavizado gaussiano/laplaciano en `src/pkg/curvilinear/normals.ts`.

### Grupo 2: Generador de Perfil Curvilíneo (TDD)
- [x] `TASK-6.2.1`: Implementar generación de la línea base paralela $B(s)$ en `src/pkg/curvilinear/generator.ts`.
- [x] `TASK-6.2.2`: Implementar extrusión ortogonal de cuadriláteros del histograma para cada bin $\text{BarPoly}_k$.
- [x] `TASK-6.2.3`: Implementar generación de isolíneas concéntricas de escala y rayos transversales de referencia.
- [x] `TASK-6.2.4`: Escribir suite de pruebas unitarias en `tests/unit/curvilinear/curvilinear.test.ts` (Casos 6.1, 6.2 y 6.3 del spec).

### Grupo 3: Integración en MapLibre GL JS y Adaptadores
- [x] `TASK-6.3.1`: Crear adaptador de capas para MapLibre en `src/pkg/curvilinear/maplibre-layers.ts`:
  - Capa de polígonos de barras (`fill` púrpura con opacidades y contornos nítidos).
  - Capa de isolíneas arcos de escala (`line` discontinua).
  - Capa de etiquetas numéricas de escala orientadas.
  - Capa de resalte activo para la barra seleccionada.
- [x] `TASK-6.3.2`: Integrar pastillas de control flotantes (Pills) sobre la baseline para alternar lado, métricas y offset.
- [x] `TASK-6.3.3`: Barrel export en `src/pkg/curvilinear/index.ts`.

### Grupo 4: Actualización de la Interfaz Web
- [x] `TASK-6.4.1`: Actualizar `src/ui/map-view.ts` para renderizar el perfil curvilíneo flotante en el mapa.
- [x] `TASK-6.4.2`: Ajustar el layout de pantalla para dar protagonismo total al mapa con su gráfico curvilíneo integrado.
- [x] `TASK-6.4.3`: Verificar con `npm test` y compilación de producción en Vite.
