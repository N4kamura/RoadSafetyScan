# SPEC-38: Escalabilidad Responsiva y Ajuste Dinámico de la Barra Flotante de Métricas

## 1. Contexto y Problemática
La barra flotante superior (`.map-floating-controls`) agrupa:
- Botón de alternancia / minimizado (`#btn-toggle-floating-controls`)
- 5 botones de selección de métricas (Siniestros, Vehículos, Personas, EPDO, Densidad)
- Botón de alternancia de lado del perfil curvilíneo (Derecha / Izquierda)
- 4 botones de separación lateral de offset (800m, 1.5km, 3km, 5km)

En pantallas con resoluciones comunes (laptops 1366x768, pantallas HD 1280x720, o ventanas en modo split screen con panel lateral abierto de 340px), el ancho total requerido por la barra ($\approx 880\text{px}$) excede el espacio horizontal disponible en el mapa, provocando que los controles del extremo derecho se corten o desborden fuera de la vista.

---

## 2. Solución de Escalabilidad Responsiva

### 2.1 Confinamiento y Límite Máximo en Contenedor (`.map-floating-controls`)
- Se define un límite horizontal relativo al ancho del visor cartográfico:
  $$\text{max-width} = \text{calc}(100\% - 5.5\text{rem})$$
  para evitar invadir el botón de alternancia del panel lateral (`left: 0.75rem`) ni desbordar el margen derecho del mapa.
- Soporte para desbordamiento elástico horizontal sin barras de scroll invasivas (`scrollbar-width: none`, `-ms-overflow-style: none`).

### 2.2 Escalado Proporcional y Compactación Adaptativa por Puntos de Quiebre (Breakpoints)
Se implementa una escala tipográfica y dimensional fluida mediante CSS:

1. **Pantallas Estándar / Amplias ($\ge 1360\text{px}$):**
   - Padding estándar (`0.25rem 0.55rem`), tamaño de fuente `0.75rem`, gap `0.55rem`.

2. **Pantallas Medianas ($1080\text{px} - 1359\text{px}$):**
   - Reducción proporcional del tamaño de fuente (`font-size: 0.68rem`).
   - Compactación de padding en píldoras (`padding: 0.2rem 0.4rem`) y botones toggle.
   - Reducción de separaciones (`gap: 0.35rem`).

3. **Pantallas Compactas ($768\text{px} - 1079\text{px}$):**
   - Escala ultra-compacta (`font-size: 0.62rem`).
   - Padding optimizado (`padding: 0.15rem 0.32rem`).
   - Adaptación de etiquetas para maximizar espacio útil (`Lado: Der/Izq`).

4. **Pantallas Estrechas / Móviles ($< 768\text{px}$):**
   - Transición a flujo multilínea / envolvente (`flex-wrap: wrap; gap: 0.35rem;`) con orientación ergonómica que garantiza acceso al 100% de los controles.

---

## 3. Criterios de Aceptación
1. En cualquier resolución de pantalla entre 600px y 2560px, la barra `.map-floating-controls` no debe sobrepasar los bordes del mapa ni cortar botones.
2. El botón de colapso/expansión `#btn-toggle-floating-controls` ubicado a la izquierda debe permanecer visible y plenamente clickeable.
3. La suite de pruebas debe continuar aprobando al 100%.
