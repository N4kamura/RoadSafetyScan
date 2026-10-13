# SPEC-21: Edición Interactiva, Bloqueo de Seguridad y Gestión de Trazos Viales

- **ID:** SPEC-21
- **Módulo:** `pkg/tracer`, `ui`
- **Estado:** `APPROVED` (Listo para implementación)
- **Trazabilidad:** [Constitution - Principle 1, 2, 5 & Modules 2, 5](file:///d:/Projects/RoadSafetyScan/constitution.md), [SPEC-15](file:///d:/Projects/RoadSafetyScan/specs/15-interactive-trace-drawing-and-gtfs-storage.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Necesidad Operativa
Los analistas viales y técnicos municipales frecuentemente necesitan refinar un trazado después de haberlo guardado (ej. corregir un vértice mal ubicado en una intersección o extender el eje). Actualmente, una vez guardado un trazo, permanece estático.

Asimismo, para evitar clics accidentales en el mapa que desconfiguren un corredor vial ya auditado, se requiere un mecanismo formal de **Bloqueo / Desbloqueo Seguro**:
1. Por defecto, todo trazo guardado o cargado debe permanecer en estado **Bloqueado (🔒 Locked)**.
2. Si el usuario desea modificarlo, debe accionar conscientemente un botón de desbloqueo/edición.
3. El sistema debe presentar una advertencia clara antes de habilitar la manipulación de vértices.
4. En modo edición, el usuario debe poder arrastrar vértices, añadir nuevos puntos o deshacer cambios.
5. Al finalizar, el trazo se guarda, actualiza los archivos locales (.txt / GTFS) y vuelve al estado protegido **Bloqueado (🔒)**.

---

## 2. Requisitos Funcionales

### 2.1 Requisito 21.1: Estado de Bloqueo en `ManagedRoute`
- Agregar la propiedad `isLocked: boolean` al modelo de datos `ManagedRoute`.
- Rutas del sistema (ej. ruta de ejemplo) o rutas personalizadas nacen bloqueadas (`isLocked = true`).

### 2.2 Requisito 21.2: Modal de Confirmación y Advertencia Previa
- Al hacer clic en "Editar Trazo" / "Desbloquear", se despliega un aviso modal:
  > *"⚠️ Advertencia de Modificación de Alineamiento Vial"*
  > *"Estás a punto de desbloquear y modificar el trazado '[Nombre de Ruta]'. Al mover o agregar vértices se recalcularán automáticamente el cadenamiento geodésico, la proyección LRS y el histograma de siniestralidad."*
  > *Opciones: [ Desbloquear y Editar ] / [ Cancelar ]*

### 2.3 Requisito 21.3: Modo de Edición de Vértices en el Mapa
- Se activan marcadores interactivos en cada vértice del alineamiento activo.
- Los vértices pueden arrastrarse (`dragend`) actualizando la polilínea en tiempo real.
- Clic sobre el mapa añade un nuevo vértice al final del trazado.
- Barra de herramientas superior:
  - Información: `Editando: [Nombre] | Vértices: N | Longitud: X km`
  - Botón: `↶ Deshacer último cambio`
  - Botón: `✕ Descartar`
  - Botón: `✓ Guardar y Bloquear 🔒`

### 2.4 Requisito 21.4: Propagación Reactiva y Persistencia
- Al guardar:
  - Se regenera el objeto `Alignment` con las coordenadas actualizadas.
  - Se persiste en `localStorage`.
  - Se actualizan los archivos de exportación (`.txt` y GTFS).
  - Se notifica a los suscriptores (`RouteManager.notify()`), refrescando MapLibre, LRS, KPIs y el perfil curvilíneo.

---

## 3. Criterios de Aceptación (DoD)

1. Un trazo bloqueado no permite mover vértices por clics accidentales.
2. La advertencia modal siempre se muestra antes de entrar al modo de edición.
3. Al editar y guardar, la longitud total, vértices y resultados LRS se recalculan de manera reactiva e inmediata.
4. Pruebas unitarias cubren el ciclo de vida: `lockRoute()`, `unlockRoute()`, `updateRouteGeometry()`.
