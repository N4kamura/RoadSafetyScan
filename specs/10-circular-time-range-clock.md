# SPEC-10: Reloj Dinámico Circular de Selección de Rango Horario (Time-Range Clock)

- **ID:** SPEC-10
- **Módulo:** `pkg/viz` & `ui/time-clock`
- **Estado:** `COMPLETADO (IMPLEMENTED)`
- **Trazabilidad:** [Constitution - Principle 4 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md#L29-L33)
- **Especificaciones Relacionadas:** [SPEC-03](file:///d:/Projects/RoadSafetyScan/specs/03-lrs-projection-engine.md), [SPEC-04](file:///d:/Projects/RoadSafetyScan/specs/04-reactive-visualization-profiler.md), [SPEC-06](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Necesidad del Usuario
El análisis de seguridad vial requiere evaluar la concentración de accidentes según patrones horarios (horas punta, nocturnidad, madrugada). Los selectores numéricos o sliders lineales tradicionales no representan adecuadamente la naturaleza cíclica de las 24 horas del día ni facilitan definir ventanas de tiempo que cruzan la medianoche (por ejemplo, turnos nocturnos de 22:00 a 05:00).

El usuario requiere que:
> *"En la esquina inferior izquierda del mapa habrá un círculo como un reloj, yo puedo indicar allí el rango horario pero es dinámica. Es decir, todo el perímetro se pinta de color negro, pero el rango horario que yo escoja sería la franja que está en blanco, así que yo puedo medir qué tanto es la ventana de hora para filtrar los accidentes. Adicionalmente yo puedo rotar esa franja para mover los intervalos de hora. Te dejo una imagen de referencias."*

---

## 2. Requisitos Técnicos y Criterios de Aceptación

### 2.1 Requisito 10.1: Modelo Geométrico y Temporal de 24 Horas
- El cuadrante circular representa un ciclo completo de 24 horas ($T \in [0, 1440)$ minutos).
- Orientación horaria estándar:
  - $00:00$ (medianoche) se ubica en la posición superior ($12$ en punto, ángulo $\theta = -90^\circ$).
  - $06:00$ se ubica a la derecha ($3$ en punto, $\theta = 0^\circ$).
  - $12:00$ (mediodía) se ubica abajo ($6$ en punto, $\theta = 90^\circ$).
  - $18:00$ se ubica a la izquierda ($9$ en punto, $\theta = 180^\circ$).
- La escala angular es $\Delta \theta = 360^\circ / 1440\text{ min} = 0.25^\circ / \text{min}$.

### 2.2 Requisito 10.2: Apariencia Visual Conforme a Imagen de Referencia
- Contenedor circular flotante en la esquina inferior izquierda del mapa.
- Anillo perimetral oscuro/negro (`#1E293B`) que representa el tiempo inactivo.
- Franja blanca (`#FFFFFF`) que representa la ventana horaria activa seleccionada.
- Texto central con tipografía nítida y jerarquía:
  - Línea 1: Hora de inicio formateada en 24h (`HH:MM`, ej. `23:21`).
  - Línea 2: Etiqueta descriptiva (`to`).
  - Línea 3: Hora de fin formateada en 24h (`HH:MM`, ej. `18:00`).

### 2.3 Requisito 10.3: Modos de Interacción Dinámica
1. **Redimensionamiento de Ventana (Handles de Extremo):**
   - El usuario puede arrastrar el extremo de inicio para modificar la hora de inicio.
   - El usuario puede arrastrar el extremo de fin para modificar la hora de fin.
   - La ventana puede abarcar desde unos pocos minutos hasta las 24 horas completas.
2. **Rotación de la Ventana Completa (Desplazamiento del Intervalo):**
   - Al arrastrar el cuerpo de la franja o el interior del cuadrante, el intervalo horario completo se traslada angularmente manteniendo constante la duración de la ventana.
3. **Soporte de Cruce de Medianoche:**
   - Si $t_{\text{inicio}} \le t_{\text{fin}}$, la ventana activa es $[t_{\text{inicio}}, t_{\text{fin}}]$.
   - Si $t_{\text{inicio}} > t_{\text{fin}}$, la ventana activa cruza la medianoche: $[t_{\text{inicio}}, 1440) \cup [0, t_{\text{fin}}]$.

### 2.4 Requisito 10.4: Filtrado Reactivo de Siniestros en el Store
- El estado de filtros en `VizStore` (`FilterState`) incluye `timeRange: { startMinute: number, endMinute: number } | null`.
- Al cambiar el rango, `recomputeFilteredCrashes()` evalúa el campo `crash.timestamp` de cada siniestro y filtra aquellos fuera del intervalo.
- Se dispara `recalculateLrs()`, actualizando reactivamente en tiempo real:
  - Los KPIs del corredor vial.
  - Las barras del perfil curvilíneo en el mapa.
  - Los puntos de siniestros visibles en zoom cercano.

### 2.5 Requisito 10.5: Criterios de Aceptación (DoD)
1. Tests unitarios en `tests/unit/viz/time-clock-filter.test.ts` verifican:
   - Filtrado dentro del mismo día ($t_{\text{inicio}} \le t_{\text{fin}}$).
   - Filtrado cruzando la medianoche ($t_{\text{inicio}} > t_{\text{fin}}$).
   - Conversión de minutos a formato `HH:MM`.
2. Componente `CircularTimeClockController` instanciado y operativo en `src/ui/time-clock.ts`.
3. 100% de tests pasando en `npm test`.
