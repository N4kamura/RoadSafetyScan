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
import { CrashPoint } from './pkg/lrs/types.js';

// Cargar datos simulados del corredor Panamericana Sur
import { MOCK_ALIGNMENT_DATA, MOCK_CRASHES_DATA } from './mock-data.js';

function initApp() {
  // 1. Inicializar alineamiento vial base
  const alignmentCoordinates = MOCK_ALIGNMENT_DATA.coordinates.map((coord: number[]) => ({
    longitude: coord[0],
    latitude: coord[1]
  }));

  const initialAlignment = createAlignment(
    alignmentCoordinates,
    MOCK_ALIGNMENT_DATA.id,
    MOCK_ALIGNMENT_DATA.name
  );

  // 2. Inicializar base de siniestros base
  const initialCrashes: CrashPoint[] = MOCK_CRASHES_DATA;

  // 3. Crear Store Reactivo Central
  const store = new VizStore(initialAlignment, initialCrashes);

  // 4. Inicializar Controladores de la Interfaz
  const mapController = new MapViewController('map-container', store);
  const sidebarController = new SidebarController(store);
  const timeClockController = new CircularTimeClockController('time-clock-container', store);

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
