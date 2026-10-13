# Tareas de Implementación: SPEC-14 — Integración de Bases de Datos ONSV, Métrica de Vehículos y Perfilado de Personas por Gravedad

Este documento desglosa las tareas de ingeniería de software para cumplir con los criterios de aceptación de **SPEC-14**.

---

## Tareas

- [x] **TASK-14.1.1:** Desarrollar script de extracción y conversión `scripts/build_database.py` para procesar las 3 BBDD de Excel con encabezados en la fila 5 (Siniestros Fatales hasta col AA, Vehículos y Personas), generar la BBDD SQLite3 `db/roadsafety.db` con tablas indexadas y exportar el dataset web `public/data/crashes_web.json` y `db/crashes_web.json`.
- [x] **TASK-14.2.1:** Extender los modelos de tipos en `src/pkg/lrs/types.ts` (`CrashPoint`, `PersonsBreakdown`, `LrsBinAggregate`) y en `src/pkg/viz/types.ts` (`MetricMode` con `'VEHICLES'` y `'PERSONS'`).
- [x] **TASK-14.2.2:** Actualizar el motor de agregación LRS en `src/pkg/lrs/aggregator.ts` para computar `totalVehicles`, `totalPersons` y el desglose de `personsBreakdown` (`fallecido`, `lesionado`, `noSeConoce`, `ileso`) por cada bin.
- [x] **TASK-14.3.1:** Actualizar el generador del perfil curvilíneo en `src/pkg/curvilinear/generator.ts` y tipos correspondientes para soportar los modos de métrica `'VEHICLES'` y `'PERSONS'`, escalando la altura de las barras según la métrica seleccionada.
- [x] **TASK-14.3.2:** Actualizar el adaptador de VisQuill en `src/pkg/viz/visquill-adapter.ts` y el visualizador longitudinal `src/ui/profile-view.ts` para renderizar barras apiladas segmentadas por gravedad en modo `'PERSONS'` y barras de conteo en modo `'VEHICLES'`.
- [x] **TASK-14.4.1:** Actualizar los popups del mapa en `src/ui/map-view.ts` para mostrar la cantidad de vehículos involucrados y el desglose por gravedad de personas involucradas al interactuar con siniestros y barras curvilíneas.
- [x] **TASK-14.5.1:** Actualizar `src/ui/sidebar.ts` e `index.html` para incorporar controles de selección de métrica (Siniestros, Vehículos, Personas, EPDO), KPIs de vehículos y personas en la barra lateral, y pastillas flotantes en el mapa.
- [x] **TASK-14.5.2:** Implementar la carga web automática de `/data/crashes_web.json` al inicializar la aplicación en `src/main.ts` con respaldo transparente a datos locales en caso de desconexión.
- [x] **TASK-14.6.1:** Crear suite de pruebas unitarias en `tests/unit/lrs/database-aggregates.test.ts` y `tests/unit/viz/metric-mode.test.ts` para validar cálculos de vehículos, personas por gravedad y cambios de métrica.
- [x] **TASK-14.6.2:** Ejecutar `npm test`, compilar con `npm run build` y verificar integridad de toda la aplicación.
