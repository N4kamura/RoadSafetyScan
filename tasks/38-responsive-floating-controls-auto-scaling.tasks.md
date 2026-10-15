# Tareas de Implementación - SPEC-38: Escalabilidad Responsiva y Ajuste Dinámico de la Barra Flotante de Métricas

- [x] **TASK-38.1: Confinamiento y Escalado CSS en `src/ui/styles.css`**
  - Añadir `max-width: calc(100% - 5.5rem)` a `.map-floating-controls`.
  - Configurar `overflow-x: auto` con ocultamiento de scrollbar para evitar desbordamientos en cualquier ancho.
  - Implementar media queries escalonadas para compactar tipografía, paddings y espaciados en pantallas medianas y compactas.
  - Añadir soporte envolvente (`flex-wrap: wrap`) en pantallas angostas ($< 768\text{px}$).

- [x] **TASK-38.2: Verificación de Comportamiento e Integración**
  - Comprobar que en anchos reducidos el botón izquierdo de colapso y las pastillas se escalan uniformemente.
  - Comprobar que no hay solapamiento con la leyenda ni con el botón flotante del sidebar.

- [x] **TASK-38.3: Pruebas y Compilación**
  - Ejecutar `npm test` y verificar 100% de éxito.
  - Ejecutar `npm run build` y verificar bundle de producción.
