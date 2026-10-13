# SPEC-18: Documentación de Despliegue, Guía de Inicio Rápido y Gobernanza de Datos ONSV (README.md)

- **ID de Especificación:** `SPEC-18`
- **Módulos Afectados:** `docs`, `README.md`
- **Estado:** `FROZEN (Listo para Implementación)`
- **Dependencias:** Constitución del Proyecto, `SPEC-01` a `SPEC-17`
- **Fecha de Aprobación:** 2026-10-13

---

## 1. Contexto y Objetivos

Para que cualquier usuario, auditor vial o desarrollador pueda clonar, ejecutar, desplegar y auditar la plataforma **RoadSafetyScan** en su propio entorno web sin fricciones, el repositorio debe contar con un archivo maestro `README.md` estructurado y completo.

El documento debe detallar:
1. **Presentación de la Plataforma:** VisQuill GDK, LRS, metodología *Profiles along a line*.
2. **Bases de Datos Incluidas (ONSV - MTC):** Explicación de los datos preprocesados de personas, vehículos y siniestros fatales 2021-2025 (`db/roadsafety.db` y `public/data/crashes_web.json`), corredores viales (Panamericana Sur y Panamericana Norte) y bundles GTFS en `routes/`.
3. **Requisitos Previos:** Node.js (v18+) y gestor de paquetes (`npm`). Python 3 opcional para scripts de re-procesamiento.
4. **Guía de Instalación y Ejecución Paso a Paso:** Comandos exactos para instalación de dependencias y ejecución en desarrollo (`npm run dev`) y producción (`npm run build`).
5. **Funcionalidades Clave y Herramientas:** Trazador interactivo, reloj dinámico, selector de métricas, exportador interoperable (CSV, GeoJSON, GTFS, .txt) y alternancia de temas Claro/Oscuro.
6. **Estructura del Proyecto y Metodología SDD:** Explicación del marco Spec-Driven Development.

---

## 2. Criterios de Aceptación (Acceptance Criteria)

1. **AC-18.1:** El archivo `README.md` debe estar ubicado en la raíz del proyecto.
2. **AC-18.2:** Contiene instrucciones paso a paso verificadas y reproducibles para ejecutar la web localmente.
3. **AC-18.3:** Describe explícitamente la base de datos procesada de la ONSV del MTC incluida en el repositorio.
4. **AC-18.4:** Describe los comandos de npm (`dev`, `build`, `test`, `preview`) y scripts auxiliares en Python.
