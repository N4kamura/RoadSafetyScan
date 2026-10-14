/**
/**
 * Módulo de Detección de Auto-Intersecciones, Desenredo de Bucles (Anti-Knot)
 * y Suavizado Espacial de Polilíneas Desplazadas.
 * Conforme a SPEC-20 (pkg/curvilinear)
 */

export interface Point2D {
  x: number; // Longitude o X métrico
  y: number; // Latitude o Y métrico
}

/**
 * Determina si dos segmentos [p1, p2] y [p3, p4] se intersectan en 2D.
 * Si se intersectan, retorna el punto exacto de intersección; si no, retorna null.
 */
export function findSegmentIntersection(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number]
): [number, number] | null {
  const x1 = p1[0];
  const y1 = p1[1];
  const x2 = p2[0];
  const y2 = p2[1];
  const x3 = p3[0];
  const y3 = p3[1];
  const x4 = p4[0];
  const y4 = p4[1];

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 1e-12) {
    return null; // Líneas paralelas o colineales
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  // Verificamos que la intersección ocurra estrictamente dentro de ambos segmentos
  // Dejamos un margen minúsculo en los bordes para evitar considerar adyacencias como intersección
  const EPSILON = 1e-6;
  if (ua > EPSILON && ua < 1 - EPSILON && ub > EPSILON && ub < 1 - EPSILON) {
    const ix = x1 + ua * (x2 - x1);
    const iy = y1 + ua * (y2 - y1);
    return [Number(ix.toFixed(7)), Number(iy.toFixed(7))];
  }

  return null;
}

/**
 * Desenreda una polilínea eliminando bucles internos (singularidades en corbatín / nudos)
 * causados por curvaturas cerradas donde el radio de curvatura es menor al offset.
 *
 * @param coordinates Array ordenado de coordenadas [lon, lat]
 * @param maxIterations Límite de seguridad de iteraciones
 * @returns Array de coordenadas desenredado y continuo
 */
export function untanglePolyline(
  coordinates: [number, number][],
  maxIterations: number = 25
): [number, number][] {
  if (coordinates.length < 4) {
    return coordinates;
  }

  let pts = coordinates.slice();
  let iteration = 0;
  let hasIntersection = true;

  while (hasIntersection && iteration < maxIterations) {
    hasIntersection = false;
    iteration++;

    const n = pts.length;
    let loopFound = false;

    for (let i = 0; i < n - 2 && !loopFound; i++) {
      for (let j = i + 2; j < n - 1 && !loopFound; j++) {
        // Evitar comparar segmentos casi consecutivos si comparten vértice
        if (j === i + 1) continue;

        const inter = findSegmentIntersection(pts[i], pts[i + 1], pts[j], pts[j + 1]);
        if (inter) {
          // Bucle detectado entre segmento i y segmento j
          // Reemplazamos la subsecuencia interna [i+1 ... j] por el punto de intersección inter
          const newPts: [number, number][] = [];
          for (let k = 0; k <= i; k++) {
            newPts.push(pts[k]);
          }
          newPts.push(inter);
          for (let k = j + 1; k < n; k++) {
            newPts.push(pts[k]);
          }

          pts = newPts;
          hasIntersection = true;
          loopFound = true;
        }
      }
    }
  }

  return pts;
}

/**
 * Desenreda una polilínea y mantiene la correspondencia 1 a 1 de las progresivas viales asociadas (SPEC-27).
 *
 * @param coordinates Coordenadas [lon, lat]
 * @param stations Progresivas métricas de carretera correspondientes a cada coordenada
 * @param maxIterations Límite de iteraciones
 */
export function untanglePolylineWithStations(
  coordinates: [number, number][],
  stations: number[],
  maxIterations: number = 25
): { coordinates: [number, number][]; stations: number[] } {
  if (coordinates.length < 4 || stations.length !== coordinates.length) {
    return { coordinates: coordinates.slice(), stations: stations.slice() };
  }

  let pts = coordinates.slice();
  let sts = stations.slice();
  let iteration = 0;
  let hasIntersection = true;

  while (hasIntersection && iteration < maxIterations) {
    hasIntersection = false;
    iteration++;

    const n = pts.length;
    let loopFound = false;

    for (let i = 0; i < n - 2 && !loopFound; i++) {
      for (let j = i + 2; j < n - 1 && !loopFound; j++) {
        if (j === i + 1) continue;

        const inter = findSegmentIntersection(pts[i], pts[i + 1], pts[j], pts[j + 1]);
        if (inter) {
          const newPts: [number, number][] = [];
          const newSts: number[] = [];

          for (let k = 0; k <= i; k++) {
            newPts.push(pts[k]);
            newSts.push(sts[k]);
          }

          // Punto de intersección desenredado con progresiva interpolada
          newPts.push(inter);
          newSts.push((sts[i] + sts[j + 1]) / 2);

          for (let k = j + 1; k < n; k++) {
            newPts.push(pts[k]);
            newSts.push(sts[k]);
          }

          pts = newPts;
          sts = newSts;
          hasIntersection = true;
          loopFound = true;
        }
      }
    }
  }

  return { coordinates: pts, stations: sts };
}

/**
 * Aplica un filtro de suavizado gaussiano/laplaciano espacial sobre una secuencia
 * de coordenadas, preservando intactos los puntos extremos inicial y final.
 *
 * @param coordinates Array de coordenadas [lon, lat]
 * @param windowSize Tamaño de ventana móvil impar (default: 5)
 * @param iterations Número de pasadas de suavizado (default: 2)
 */
export function smoothCoordinates(
  coordinates: [number, number][],
  windowSize: number = 5,
  iterations: number = 2
): [number, number][] {
  if (coordinates.length <= 2) {
    return coordinates;
  }

  let current = coordinates.slice();
  const radius = Math.floor(windowSize / 2);

  // Coeficientes gaussianos aproximados normalizados
  const weights: number[] = [];
  const sigma = radius / 1.6;
  let sumW = 0;
  for (let offset = -radius; offset <= radius; offset++) {
    const w = Math.exp(-(offset * offset) / (2 * sigma * sigma));
    weights.push(w);
    sumW += w;
  }

  for (let iter = 0; iter < iterations; iter++) {
    const smoothed: [number, number][] = [];
    const n = current.length;

    for (let i = 0; i < n; i++) {
      if (i === 0 || i === n - 1) {
        // Preservar extremos terminales anclados
        smoothed.push(current[i]);
        continue;
      }

      let accX = 0;
      let accY = 0;
      let totalWeight = 0;

      for (let offset = -radius; offset <= radius; offset++) {
        const idx = i + offset;
        if (idx >= 0 && idx < n) {
          const w = weights[offset + radius];
          accX += current[idx][0] * w;
          accY += current[idx][1] * w;
          totalWeight += w;
        }
      }

      smoothed.push([
        Number((accX / totalWeight).toFixed(6)),
        Number((accY / totalWeight).toFixed(6))
      ]);
    }

    current = smoothed;
  }

  return current;
}
