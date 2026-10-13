# SPEC-16: Limpieza Integral de Interfaz, Corrección de Contraste y Armonización Visual (Modo Claro / Modo Oscuro)

- **ID:** SPEC-16
- **Módulo:** `ui`, `pkg/viz`
- **Estado:** `COMPLETADO (IMPLEMENTED)`
- **Trazabilidad:** [Constitution - Principles 1, 4, 5 & Module 4](file:///d:/Projects/RoadSafetyScan/constitution.md)
- **Especificaciones Relacionadas:** [SPEC-04](file:///d:/Projects/RoadSafetyScan/specs/04-reactive-visualization-profiler.md), [SPEC-06](file:///d:/Projects/RoadSafetyScan/specs/06-curvilinear-profile-along-line.md), [SPEC-10](file:///d:/Projects/RoadSafetyScan/specs/10-circular-time-range-clock.md), [SPEC-13](file:///d:/Projects/RoadSafetyScan/specs/13-annual-temporal-filter.md), [SPEC-14](file:///d:/Projects/RoadSafetyScan/specs/14-database-integration-and-severity-profiling.md), [SPEC-15](file:///d:/Projects/RoadSafetyScan/specs/15-interactive-trace-drawing-and-gtfs-storage.md)

---

## 1. Declaración del Problema y Justificación

### 1.1 Contexto de Usabilidad y Accesibilidad
La aplicación RoadSafetyScan está orientada a ingenieros viales, fiscalizadores de transporte y analistas del sector público (MTC, SUTRAN, ATU, gobiernos regionales y municipios).
Durante la evolución ágil del sistema:
1. Se expusieron badges técnicos de desarrollo en la cabecera (como `SPEC-15: Trazo & GTFS`), los cuales generan ruido visual y deben ser de uso estrictamente interno del repositorio SDD.
2. Ciertos botones y controles interactivos reutilizaron clases `.btn-outline` o estilos heredados con color de texto gris claro (`#e2e8f0` o `#94a3b8`) pensados para fondos oscuros. En Modo Claro (sobre fondo blanco o `#f8fafc`), esto causó una pérdida severa de contraste, volviendo casi invisibles las etiquetas de texto de:
   - Los botones de **Dimensión a Graficar en Barras** (`Siniestros`, `Vehículos`, `Personas`, `EPDO`).
   - El botón de **Minimizar / Restaurar** del panel del perfil longitudinal de barras.
   - Los botones rápidos (`Todos`, `Último Año`, `Limpiar`) y chips de selección de **Años de Siniestros**.
3. Es necesario realizar una **limpieza y armonización visual integral de toda la interfaz** (UI Polishing) asegurando legibilidad perfecta tanto en **Modo Claro** como en **Modo Oscuro**, cumpliendo los estándares de contraste WCAG AA/AAA.

### 1.2 Requerimiento del Usuario
> *"Esta perfecto, ahora veo que en la web sale el SPEC-15, eso es algo de desarrollo, retíralo. Por otro lado los botones de 'Dimensión a Graficar en Barras', 'Minimizar' del perfil longitudinal y los filtros de 'AÑOS DE SINIESTROS' tienen el color de letras de color gris, en modo claro no se ven, en modo oscuro sí, ¿puede arreglarlo? En ambos modos debería verse bien.*
> 
> *Hay que limpiar toda la interfaz en sí, tómalo como un nuevo SPEC en todo caso."*

---

## 2. Requisitos Técnicos y Arquitectura

### 2.1 Requisito 16.1: Retiro de Artefactos de Desarrollo de la Cabecera
- Eliminar la insignia visible `SPEC-15: Trazo & GTFS` de la cabecera en `index.html`.
- Preservar únicamente insignias informativas de contexto real para el auditor:
  - Nombre del corredor vial en análisis (`PE-1S: Panamericana Sur...`).
  - Fuente del dataset georreferenciado (`BBDD ONSV: SQLite3 / Web`).
- Incorporar control interactivo de alternancia de tema visual (Modo Claro / Modo Oscuro) en la cabecera.

### 2.2 Requisito 16.2: Refactorización del Sistema de Contraste y Botones
- **Desacoplar botones de cabecera de botones de contenido:**
  - Los botones de la cabecera (fondo oscuro `#0f172a`) mantienen estilos adaptados a superficies oscuras (`.app-header .btn-secondary`, `.app-header .btn-outline`).
  - Los botones del panel lateral, gráficos y modales utilizan variables temáticas adaptativas (`var(--text-main)`, `var(--bg-card)`, `var(--border-color)`), asegurando texto nítido y oscuro en Modo Claro (`#0f172a` / `#1e293b`) y texto claro de alto contraste en Modo Oscuro (`#f8fafc`).
- **Botones de Dimensión a Graficar (`.btn-metric-selector`):**
  - Estado inactivo: Fondo blanco/tarjeta, borde visible `#cbd5e1`, texto negro carbón `#0f172a` (en claro) y `#f8fafc` (en oscuro).
  - Estado activo (`.active`): Fondo azul MTC `#2563eb`, texto blanco nítido `#ffffff`, borde `#2563eb`, sombra de elevación.
- **Botón Minimizar del Perfil Longitudinal (`.btn-minimize-profile`):**
  - Texto de alto contraste con icono dinámico (`▼ Minimizar` / `▲ Restaurar`), fondo de tarjeta y borde contrastado.
- **Controles y Chips de Años de Siniestros (`.btn-year-quick` y `.year-chip-item`):**
  - Botones rápidos `Todos`, `Último Año` y `Limpiar` con texto nítido `#0f172a` en modo claro.
  - Chips de años con checkboxes visibles, números de año en peso semibold y badges de conteo diferenciados.

### 2.3 Requisito 16.3: Variables Semánticas y Compatibilidad de Temas Claro / Oscuro
- Definición de tokens en `:root`:
  ```css
  :root {
    --primary: #2563eb;
    --primary-hover: #1d4ed8;
    --primary-light: #eff6ff;
    --primary-dark: #1e40af;
    --text-main: #0f172a;
    --text-muted: #475569;
    --border-color: #cbd5e1;
    --border-hover: #94a3b8;
    --bg-app: #f8fafc;
    --bg-panel: #ffffff;
    --bg-card: #ffffff;
    --bg-hover: #f1f5f9;
  }
  ```
- Soporte automático para `@media (prefers-color-scheme: dark)` y soporte manual mediante atributo `data-theme="dark"` / `data-theme="light"` en `<html>` con persistencia en `localStorage`.

### 2.4 Requisito 16.4: Limpieza y Pulido Visual de Todos los Componentes (UI Polish)
- **Panel Lateral:** Títulos de sección sobrios con tipografía sans-serif limpia, inputs y selects estilizados con bordes sutiles y focus states accesibles.
- **Tarjetas KPI:** Valores numéricos claros y contrastados sobre fondo de tarjeta con bordes refinados.
- **Lista de Rutas del Gestor:** Separación limpia de items de ruta con badges de color, kilometraje legible y botones de descarga discretos.
- **Pastillas Flotantes y Leyenda en Mapa:** Fondos translúcidos con desenfoque de fondo (*backdrop-filter: blur*), texto nítido y bordes delimitados.

---

## 3. Criterios de Aceptación (Definition of Done)

1. **Ausencia de Etiquetas de Desarrollo:**
   - La interfaz no muestra insignias de texto tipo `SPEC-XX` en la cabecera ni en los paneles visibles al usuario.
2. **Legibilidad y Contraste:**
   - Los botones de Dimensión a Graficar, el botón Minimizar y los botones/chips de Años tienen un contraste mínimo $\ge 4.5:1$ (WCAG AA) respecto a sus fondos tanto en Modo Claro como en Modo Oscuro.
   - En Modo Claro las letras no son gris claro ni blancas sobre blanco.
3. **Alternancia de Tema:**
   - El usuario puede alternar entre Modo Claro y Modo Oscuro mediante el control de cabecera o mediante la preferencia del sistema operativo.
4. **Verificación Técnica:**
   - Pruebas unitarias de la aplicación pasan al 100% en Vitest.
   - Compilación de producción con TypeScript y Vite libre de errores (`npm run build`).
