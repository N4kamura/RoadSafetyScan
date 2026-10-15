# SPEC-37: Reorganización del Panel Lateral - Priorización de Parámetros LRS tras Rutas Activas

## 1. Contexto y Justificación UX
En la arquitectura de interfaz previa, los Parámetros de Referenciación Lineal (LRS) —faja de influencia/buffer y tamaño de bin métrico $\Delta S$— se encontraban ubicados en la parte inferior del panel lateral (Sección 3), después del Diagnóstico del Corredor, de la selección de métricas y de los parámetros de proyección del perfil curvilíneo.

Operativamente, el usuario necesita definir primero **sobre qué eje vial trabaja** (Rutas Activas) y **bajo qué parámetros espaciales se realiza la captura geométrica** (Ancho de Buffer y Segmentación $\Delta S$), para luego evaluar los resultados diagnósticos y la visualización gráfica de barras.

Este cambio ubica la configuración LRS inmediatamente después de la selección de Rutas Activas en el mapa, optimizando el flujo de trabajo secuencial.

---

## 2. Nuevo Orden Jerárquico del Panel Lateral (`aside.app-sidebar`)

1. **Sección 1: Rutas y Trazados Viales**
   - Eje Principal en Análisis (`select-corridor-trace`)
   - Botones rápidos: Dibujar Trazo (`btn-draw-trace-sidebar`) y Calcular LRS (`btn-run-calculation`)
   - Gestor de Rutas Activas en el Mapa (`routes-manager-list`)

2. **Sección 2: Parámetros de Referenciación Lineal (LRS)** *(Reubicada con alta prioridad)*
   - Ancho de Faja (Buffer): `slider-buffer-width` (5 m a 100 m)
   - Segmentación Métrica ($\Delta S$): `slider-bin-size` (100 m a 2000 m) con presets rápidos (Detalle 100m, Urbano 200m, Carretera 500m, Regional 1km)

3. **Sección 3: Diagnóstico del Corredor y Métricas**
   - Tarjetas KPI: Longitud de Eje, Siniestros en Faja, Vehículos Involucrados, Personas Involucradas, Fuera de Buffer, EPDO Acumulado
   - Selector de Dimensión a Graficar en Barras: Siniestros, Vehículos, Personas, EPDO
   - Indicador de Tramo Crítico (Hotspot Máximo)

4. **Sección 4: Perfil Curvilíneo Paralelo (VisQuill A1)**
   - Separación Lateral ($D_{\text{offset}}$): Slider $400\text{ m} - 8,000\text{ m}$
   - Indicador de Escala de Altura (ajustable en mapa con botón rectangular)
   - Lado de Proyección: Derecha (Este) / Izquierda (Oeste)

5. **Sección 5: Severidad Vial (MTC Perú)**
   - Filtros de severidad ponderada (Fatal, Lesiones Graves, Lesiones Leves, Solo Daños)

6. **Sección 6: Filtro Temporal por Años (2021-2025)**

7. **Sección 7: Exportación de Resultados Interoperables**
   - CSV, GeoJSON siniestros, GeoJSON corredor, Trazo .txt, Rutas GTFS

---

## 3. Criterios de Aceptación
1. **Jerarquía Visual en DOM:**
   El elemento `#slider-buffer-width` y `#slider-bin-size` deben aparecer en el DOM antes del contenedor `#kpi-total-km` y de la sección `#slider-curv-offset`.
2. **Preservación de IDs y Listeners:**
   Todos los IDs (`slider-buffer-width`, `val-buffer-width`, `slider-bin-size`, `val-bin-size`, botones `.btn-preset-bin`) conservan sus identificadores intactos para no alterar la inicialización de eventos en [`src/ui/sidebar.ts`](file:///d:/Projects/RoadSafetyScan/src/ui/sidebar.ts).
3. **Pruebas y Compatibilidad:**
   Todos los tests de interfaz y colapso de paneles (`tests/unit/ui/collapsible-panels.test.ts` y suite global) deben pasar al 100%.
