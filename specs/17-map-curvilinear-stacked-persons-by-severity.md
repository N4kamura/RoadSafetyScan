# SPEC-17: Barras Curvilíneas Apiladas por Gravedad de Personas (Stacked Curvilinear Profile on Map)

- **ID de Especificación:** `SPEC-17`
- **Módulos Afectados:** `pkg/curvilinear`, `ui/map-view`, `pkg/viz`
- **Estado:** `FROZEN (Listo para Implementación)`
- **Dependencias:** `SPEC-06` (Curvilinear Profile along a Line), `SPEC-14` (BBDD ONSV & Conteo de Personas/Vehículos)
- **Fecha de Aprobación:** 2026-10-13

---

## 1. Contexto y Justificación Científica

En auditorías de seguridad vial y visualización geoespacial de acuerdo al paradigma VisQuill (*Profiles along a line*), cuando el usuario selecciona la dimensión **Personas Involucradas** (`MetricMode.PERSONS`), un total agregado plano (ej. 10 personas) oculta el riesgo crítico si no se distingue si se trata de 10 pasajeros ilesos o 10 víctimas fatales.

Pintar la barra curvilínea en el mapa dividida ortogonalmente según la gravedad de las personas (**Fallecido**, **Lesionado**, **No se conoce**, **Ileso**) es altamente conveniente y proporciona:
1. **Coherencia Visual Total:** Se alinea al 100% con el histograma longitudinal inferior de VisQuill GDK y con la leyenda cartográfica oficial.
2. **Evaluación Instantánea de Riesgo:** El auditor vial identifica de un vistazo qué tramos concentran vidas perdidas (segmento rojo en la base del perfil) frente a tramos de alta congestión con heridos leves o ilesos (naranja y verde).
3. **Continuidad Matemática:** Cada sub-segmento se genera como un polígono extruido ortogonalmente a la línea base $B(s)$, apilándose consecutivamente en la dirección del vector normal $\vec{n}(s)$.

---

## 2. Definición Geométrica y Cromática

### 2.1. Paleta de Severidad de Personas (Estándar ONSV - MTC)
- **Fallecido:** `#DC2626` (Rojo Carmesí - Nivel crítico de mortalidad)
- **Lesionado:** `#EA580C` (Naranja Intenso - Heridos graves y leves)
- **No se conoce:** `#94A3B8` (Gris Pizarra - Gravedad indeterminada en atestado policial)
- **Ileso:** `#10B981` (Verde Esmeralda - Sin afectación corporal reportada)

### 2.2. Algoritmo de Extrusión Curvilínea Apilada (Stacked Extrusion)
Para un bin métrico $[s_{\text{start}}, s_{\text{end}}]$ con $P_{\text{total}} > 0$:
Sean $h_i = c_i \times S_H$, donde $c_i$ es el conteo de la categoría $i$ y $S_H$ es el factor de escala (`heightScaleMetersPerUnit`):
1. **Capa 1 (Fallecido):** Extrusión desde $D_0 = D_{\text{offset}}$ hasta $D_1 = D_0 + h_{\text{fallecido}} \times \text{sideSign}$.
2. **Capa 2 (Lesionado):** Extrusión desde $D_1$ hasta $D_2 = D_1 + h_{\text{lesionado}} \times \text{sideSign}$.
3. **Capa 3 (No se conoce):** Extrusión desde $D_2$ hasta $D_3 = D_2 + h_{\text{noSeConoce}} \times \text{sideSign}$.
4. **Capa 4 (Ileso):** Extrusión desde $D_3$ hasta $D_4 = D_3 + h_{\text{ileso}} \times \text{sideSign}$.

Cada capa con $c_i > 0$ genera un cuadrilátero cerrado con coordenadas:
$$\mathbf{P}_{\text{slice}} = [P_{\text{start}}(D_{i-1}), Q_{\text{start}}(D_i), Q_{\text{end}}(D_i), P_{\text{end}}(D_{i-1}), P_{\text{start}}(D_{i-1})]$$

### 2.3. Interacción y Tooltip Unificado
Todos los sub-polígonos de un mismo bin comparten el identificador `binIndex`. Al posicionar el cursor sobre cualquier sub-barra en MapLibre:
- Se resaltan conjuntamente todos los segmentos del bin.
- El tooltip muestra el desglose exacto de personas por gravedad:
  - 🔴 Fallecidos: $N$
  - 🟠 Lesionados: $N$
  - ⚪ No se conoce: $N$
  - 🟢 Ilesos: $N$

---

## 3. Criterios de Aceptación (Acceptance Criteria)

1. **AC-17.1:** Cuando `metricMode === 'PERSONS'`, las barras del mapa que tengan siniestros con personas se dividen en sub-polígonos apilados con los colores rojo, naranja, gris y verde.
2. **AC-17.2:** La altura total combinada de los sub-polígonos en el mapa equivale exactamente a $\sum c_i \times S_H$.
3. **AC-17.3:** En otros modos (`COUNT`, `VEHICLES`, `EPDO`, `DENSITY_KM`), las barras se renderizan con su colorimetría dominante o temática correspondiente.
4. **AC-17.4:** El hover en el mapa resalta simultáneamente la barra completa y sincroniza con el perfil longitudinal inferior.
5. **AC-17.5:** 100% de pruebas unitarias verificadas y aprobadas en Vitest.
