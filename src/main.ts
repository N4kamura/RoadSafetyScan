/**
 * Punto de Entrada Principal de la Aplicación Web RoadSafetyScan
 * Inicialización y Ensamblaje de Componentes
 */

import 'maplibre-gl/dist/maplibre-gl.css';
import './ui/styles.css';

import { createAlignment } from './pkg/tracer/alignment.js';
import { VizStore } from './pkg/viz/store.js';
import { MapViewController } from './ui/map-view.js';
import { LongitudinalProfileView } from './ui/profile-view.js';
import { SidebarController } from './ui/sidebar.js';
import { CircularTimeClockController } from './ui/time-clock.js';
import { RouteManager } from './pkg/tracer/route-manager.js';
import { CrashPoint } from './pkg/lrs/types.js';
import { ThemeController } from './ui/theme.js';

// Cargar datos simulados del corredor Panamericana Sur
import { MOCK_ALIGNMENT_DATA, MOCK_CRASHES_DATA } from './mock-data.js';

function initApp() {
  // 1. Inicializar Gestor de Rutas Centralizado (SPEC-15)
  const routeManager = new RouteManager();
  (window as any).routeManager = routeManager;

  const primaryRoute = routeManager.getPrimaryRoute();
  const initialAlignment = primaryRoute ? primaryRoute.alignment : createAlignment(
    MOCK_ALIGNMENT_DATA.coordinates.map((coord: number[]) => ({
      longitude: coord[0],
      latitude: coord[1]
    })),
    MOCK_ALIGNMENT_DATA.id,
    MOCK_ALIGNMENT_DATA.name
  );

  // 2. Inicializar base de siniestros base
  const initialCrashes: CrashPoint[] = MOCK_CRASHES_DATA;

  // 3. Crear Store Reactivo Central
  const store = new VizStore(initialAlignment, initialCrashes);

  // Sincronizar siniestros y alineamiento cuando cambie la ruta primaria
  routeManager.subscribe((_routes, primary) => {
    if (primary) {
      store.setAlignment(primary.alignment);
      const realCrashes = (window as any).__REAL_CRASHES__;
      store.setCrashes(realCrashes || MOCK_CRASHES_DATA);
    }
  });

  // SPEC-14: Conexión con BBDD ONSV (SQLite3 convertida a formato web)
  fetch('/data/crashes_web.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((realCrashes: CrashPoint[]) => {
      if (Array.isArray(realCrashes) && realCrashes.length > 0) {
        console.log(`[SPEC-14] Cargados ${realCrashes.length} siniestros reales georreferenciados de ONSV.`);
        (window as any).__REAL_CRASHES__ = realCrashes;
        store.setCrashes(realCrashes);
        const headerSource = document.getElementById('header-source-badge');
        if (headerSource) {
          headerSource.textContent = `BBDD ONSV: ${realCrashes.length} siniestros`;
        }
      }
    })
    .catch((err) => {
      console.warn('[SPEC-14] Dataset ONSV no disponible en servidor, manteniendo contingencia local:', err);
    });

  // 4. Inicializar Controladores de la Interfaz
  const themeController = new ThemeController('btn-toggle-theme');
  themeController.init();
  (window as any).themeController = themeController;

  const mapController = new MapViewController('map-container', store, routeManager);
  const sidebarController = new SidebarController(store, routeManager, mapController.getTraceDrawer());
  const timeClockController = new CircularTimeClockController('time-clock-container', store);

  (window as any).mapViewController = mapController;
  (window as any).vizStore = store;

  const profileContainer = document.getElementById('visquill-longitudinal-profile');
  if (profileContainer) {
    new LongitudinalProfileView('visquill-longitudinal-profile', store);
  }

  // 5. Botón de Recentrar Mapa
  const btnFitMap = document.getElementById('btn-fit-map');
  if (btnFitMap) {
    btnFitMap.addEventListener('click', () => {
      mapController.fitToAlignment();
    });
  }

  // 6. Modal de Información / Licencia VisQuill
  const modalAbout = document.getElementById('modal-about');
  const btnOpenAbout = document.getElementById('btn-open-about');
  const btnCloseAbout = document.getElementById('btn-close-about');

  if (modalAbout && btnOpenAbout && btnCloseAbout) {
    btnOpenAbout.addEventListener('click', () => {
      modalAbout.style.display = 'flex';
    });

    btnCloseAbout.addEventListener('click', () => {
      modalAbout.style.display = 'none';
    });

    modalAbout.addEventListener('click', (e) => {
      if (e.target === modalAbout) {
        modalAbout.style.display = 'none';
      }
    });
  }

  console.log('RoadSafetyScan inicializado correctamente bajo Spec-Driven Development (SDD).');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
