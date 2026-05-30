/**
 * routeBuilder.ts
 * Generates realistic shipping routes between major trade cities.
 * Coordinates are [longitude, latitude] as required by MapLibre GL.
 *
 * Sea route (China → West Africa via Suez Canal): 32 waypoints following
 * the actual shipping lane through the Strait of Malacca, Indian Ocean,
 * Red Sea, Mediterranean, and down the West African coast.
 *
 * Air route: great-circle approximation over Central Asia and East Africa.
 *
 * Land route: interpolated path with intermediate waypoints.
 */

export type Coord = [number, number]; // [lng, lat]

// ---------------------------------------------------------------------------
// City coordinate lookup
// ---------------------------------------------------------------------------

const CITY_COORDS: Record<string, Coord> = {
  // China — key sourcing cities
  guangzhou: [113.26, 23.12],
  guangdong: [113.26, 23.12],
  canton: [113.26, 23.12],
  nansha: [113.26, 22.72],
  shenzhen: [114.06, 22.54],
  dongguan: [113.75, 23.02],
  foshan: [113.12, 23.02],
  zhongshan: [113.38, 22.52],
  zhuhai: [113.58, 22.27],
  shanghai: [121.47, 31.23],
  ningbo: [121.55, 29.87],
  yiwu: [120.07, 29.31],
  hangzhou: [120.15, 30.28],
  qingdao: [120.37, 36.07],
  tianjin: [117.20, 39.08],
  beijing: [116.40, 39.90],
  xiamen: [118.08, 24.46],
  wuhan: [114.30, 30.59],
  chengdu: [104.07, 30.57],
  'hong kong': [114.17, 22.32],
  hongkong: [114.17, 22.32],
  china: [113.26, 23.12], // default to Guangzhou

  // Côte d'Ivoire
  abidjan: [-4.02, 5.35],
  "côte d'ivoire": [-4.02, 5.35],
  "cote d'ivoire": [-4.02, 5.35],
  "ivory coast": [-4.02, 5.35],
  abidjan_port: [-3.98, 5.25],
  bouaké: [-5.03, 7.69],
  bouake: [-5.03, 7.69],
  yamoussoukro: [-5.27, 6.82],
  "san-pédro": [-6.64, 4.75],
  "san pedro": [-6.64, 4.75],

  // West Africa — other ports
  dakar: [-17.45, 14.72],
  accra: [-0.19, 5.55],
  tema: [-0.01, 5.62],
  lagos: [3.37, 6.52],
  apapa: [3.36, 6.44],
  lomé: [1.22, 6.14],
  lome: [1.22, 6.14],
  cotonou: [2.42, 6.37],
  conakry: [-13.68, 9.54],
  freetown: [-13.23, 8.49],
  monrovia: [-10.80, 6.30],
  'douala': [9.74, 4.05],
};

function normalizeLocationText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[,./\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find coordinates for a free-text location string.
 * Tries longest-key match first to avoid partial false positives.
 */
export function findCoords(locationText: string, fallback: Coord): Coord {
  const norm = normalizeLocationText(locationText);
  const sortedKeys = Object.keys(CITY_COORDS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (norm.includes(key)) return CITY_COORDS[key]!;
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Hardcoded realistic shipping lane routes
// ---------------------------------------------------------------------------

/**
 * Sea freight: China (Guangzhou) → Côte d'Ivoire (Abidjan)
 * Actual Cape of Good Hope route:
 *   South China Sea → Singapore → Sunda Strait → Indian Ocean (SW) →
 *   Réunion area → East of Madagascar → South of Madagascar →
 *   Cape Agulhas → Cape of Good Hope → West African Atlantic coast →
 *   Namibia → Angola → Congo → Gabon → Ghana (Tema) → Abidjan
 * 30 waypoints, fully open water — no land crossing.
 */
const SEA_CHINA_TO_WEST_AFRICA: Coord[] = [
  [113.26, 22.72],  // Guangzhou Nansha port
  [114.5, 20.0],    // South China Sea
  [112.0, 14.0],    // South China Sea south
  [107.0, 8.0],     // Approaching Singapore
  [103.82, 1.35],   // Singapore Strait
  [105.8, -5.9],    // Sunda Strait (between Sumatra & Java)
  [102.0, -12.0],   // Indian Ocean entering
  [95.0, -18.0],    // Indian Ocean heading SW
  [85.0, -22.0],    // Indian Ocean
  [75.0, -24.0],    // Indian Ocean central
  [65.0, -24.0],    // Indian Ocean west
  [57.5, -20.5],    // Near Réunion / Mauritius
  [52.0, -22.0],    // North-east of Madagascar
  [49.0, -23.5],    // East coast of Madagascar
  [47.5, -27.0],    // South-east of Madagascar
  [44.0, -31.5],    // South of Madagascar
  [36.0, -34.0],    // Approaching Cape Agulhas
  [24.0, -36.0],    // Cape Agulhas (southernmost tip of Africa)
  [18.42, -33.93],  // Cape of Good Hope / Cape Town
  [14.5, -29.0],    // Atlantic — Namibia coast
  [13.5, -22.0],    // Namibia
  [12.0, -14.0],    // Angola coast
  [11.5, -7.0],     // Northern Angola
  [11.0, -2.0],     // Congo / DRC coast
  [9.5,   0.5],     // Gabon
  [8.0,   3.5],     // Gulf of Guinea
  [3.5,   4.0],     // Gulf of Guinea — Nigeria area
  [0.0,   4.8],     // Ghana / Togo coast
  [-0.01, 5.62],    // Tema, Ghana (major container port)
  [-3.98, 5.25],    // Abidjan port
];

/**
 * Air freight: China (Guangzhou) → Côte d'Ivoire (Abidjan)
 * Great-circle route: South China → Central Asia → East Africa → West Africa.
 */
const AIR_CHINA_TO_WEST_AFRICA: Coord[] = [
  [113.30, 23.39],  // Guangzhou Baiyun Airport
  [103.5, 25.5],    // Yunnan / Myanmar
  [92.0, 25.0],     // Bangladesh / NE India
  [78.0, 24.0],     // Central India
  [65.0, 21.5],     // Pakistan / Arabian Sea
  [52.0, 18.5],     // Yemen / Oman coast
  [40.0, 14.0],     // Eritrea / Ethiopia
  [28.0, 9.0],      // South Sudan / Uganda
  [16.0, 6.5],      // Cameroon / CAR
  [4.5, 5.8],       // Nigeria / Ghana airspace
  [-3.93, 5.26],    // Abidjan Félix-Houphouët-Boigny Airport
];

// ---------------------------------------------------------------------------
// Route generation
// ---------------------------------------------------------------------------

/** Linearly interpolate N steps between two coordinates (inclusive). */
function interpolate(start: Coord, end: Coord, steps: number): Coord[] {
  if (steps <= 1) return [start, end];
  const result: Coord[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    result.push([
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t,
    ]);
  }
  return result;
}

function buildGenericSeaRoute(origin: Coord, destination: Coord): Coord[] {
  // Simple interpolation — no realistic waypoints available for this pair
  return interpolate(origin, destination, 10);
}

function buildGenericAirRoute(origin: Coord, destination: Coord): Coord[] {
  return interpolate(origin, destination, 8);
}

function buildLandRoute(origin: Coord, destination: Coord): Coord[] {
  return interpolate(origin, destination, 6);
}

/** Snap a coordinate to the nearest known route endpoint. */
function snapToKnownRoute(
  origin: Coord,
  destination: Coord
): { route: Coord[] | null } {
  const isEastAsianOrigin = origin[0] > 80 && origin[1] > 5;
  const isWestAfricanDest = destination[0] < 10 && destination[1] < 20;

  if (isEastAsianOrigin && isWestAfricanDest) {
    // Patch first and last waypoints to exact origin/destination
    return {
      route: [
        origin,
        ...SEA_CHINA_TO_WEST_AFRICA.slice(1, -1),
        destination,
      ],
    };
  }
  return { route: null };
}

function snapToKnownAirRoute(
  origin: Coord,
  destination: Coord
): { route: Coord[] | null } {
  const isEastAsianOrigin = origin[0] > 80 && origin[1] > 5;
  const isWestAfricanDest = destination[0] < 10 && destination[1] < 20;

  if (isEastAsianOrigin && isWestAfricanDest) {
    return {
      route: [
        origin,
        ...AIR_CHINA_TO_WEST_AFRICA.slice(1, -1),
        destination,
      ],
    };
  }
  return { route: null };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Build a route array for the given cargo. Returns [lng, lat] coordinates. */
export function buildCargoRoute(
  purchaseLocation: string,
  shippingDestination: string,
  shippingType: 'sea' | 'air' | 'land' = 'sea'
): Coord[] {
  const DEFAULT_ORIGIN: Coord = [113.26, 22.72];  // Guangzhou
  const DEFAULT_DEST: Coord = [-3.98, 5.25];       // Abidjan

  const origin = findCoords(purchaseLocation, DEFAULT_ORIGIN);
  const dest = findCoords(shippingDestination, DEFAULT_DEST);

  if (shippingType === 'sea') {
    const { route } = snapToKnownRoute(origin, dest);
    return route ?? buildGenericSeaRoute(origin, dest);
  }

  if (shippingType === 'air') {
    const { route } = snapToKnownAirRoute(origin, dest);
    return route ?? buildGenericAirRoute(origin, dest);
  }

  return buildLandRoute(origin, dest);
}

/**
 * Interpolate a position along the route.
 * @param route Array of [lng, lat] coords.
 * @param progress 0..1 fraction along the total route length.
 */
export function getPositionAtProgress(route: Coord[], progress: number): Coord {
  if (progress <= 0) return route[0]!;
  if (progress >= 1) return route[route.length - 1]!;

  const totalSegments = route.length - 1;
  const segment = progress * totalSegments;
  const segIndex = Math.floor(segment);
  const segT = segment - segIndex;

  const start = route[segIndex]!;
  const end = route[Math.min(segIndex + 1, route.length - 1)]!;

  return [
    start[0] + (end[0] - start[0]) * segT,
    start[1] + (end[1] - start[1]) * segT,
  ];
}
