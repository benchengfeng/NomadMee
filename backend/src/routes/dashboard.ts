import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import WebSocket from 'ws';

type InvestorCurrency = 'YUAN' | 'TND' | 'EURO';

type Investor = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  initialInvestment: number;
  currency: InvestorCurrency;
  expectedProfitRate: number;
};

type Coordinate = {
  lat: number;
  lng: number;
  label: string;
};

type AisLivePosition = {
  mmsi: number;
  lat: number;
  lng: number;
  lastSeen: string;
  sogKnots: number | null;
  cogDegrees: number | null;
};

const router = Router();
const authTokens = new Map<string, string>();

function getTrackingConfig(): {
  trackingMode: 'aisstream' | 'mock';
  apiKey: string;
  mmsiList: string[];
} {
  const trackingMode = process.env.TRACKING_MODE === 'aisstream' ? 'aisstream' : 'mock';
  const apiKey = (process.env.AISSTREAM_API_KEY || '').trim();
  const mmsiList = (process.env.AISSTREAM_MMSI || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => /^\d+$/.test(value));

  return { trackingMode, apiKey, mmsiList };
}

let liveAisPosition: AisLivePosition | null = null;
let aisSocket: WebSocket | null = null;
let aisReconnectTimer: NodeJS.Timeout | null = null;
let aisStreamInitialized = false;
let hasLoggedFirstLivePosition = false;

const investors: Investor[] = [
  {
    id: 'inv-1',
    firstName: 'Xueping',
    lastName: '',
    username: 'baq',
    password: 'Nomad2026!',
    initialInvestment: 17000,
    currency: 'YUAN',
    expectedProfitRate: 0.3,
  },
  {
    id: 'inv-2',
    firstName: 'Kais',
    lastName: 'Ben Abdallah',
    username: 'digitalkaiser',
    password: 'Nomad2026!',
    initialInvestment: 7000,
    currency: 'TND',
    expectedProfitRate: 0.3,
  },
  {
    id: 'inv-3',
    firstName: 'Houssem',
    lastName: 'Turki',
    username: 'mligshen',
    password: 'Nomad2026!',
    initialInvestment: 1500,
    currency: 'YUAN',
    expectedProfitRate: 0.3,
  },
  {
    id: 'inv-4',
    firstName: 'Mohamed Firass',
    lastName: 'Ben Hiba',
    username: 'Mrplane',
    password: 'Nomad2026!',
    initialInvestment: 400,
    currency: 'TND',
    expectedProfitRate: 0.3,
  },
  {
    id: 'inv-5',
    firstName: 'Mohamed Malek',
    lastName: 'Ben Hiba',
    username: 'bro123',
    password: 'Nomad2026!',
    initialInvestment: 280,
    currency: 'EURO',
    expectedProfitRate: 0.3,
  },
];

const cargoPath: Coordinate[] = [
  { lat: 23.1291, lng: 113.2644, label: 'Guangzhou, China' },
  { lat: 10.3157, lng: 123.8854, label: 'Cebu Sea Lane' },
  { lat: 1.3521, lng: 103.8198, label: 'Singapore Strait' },
  { lat: -20.267722, lng: 55.648639, label: 'East Africa' },
  { lat: 12.8797, lng: 45.0187, label: 'Gulf of Aden' },
  { lat: -1.2864, lng: 36.8172, label: 'East Africa Corridor' },
  { lat: 5.6037, lng: -0.187, label: 'Gulf of Guinea' },
  { lat: 5.3599, lng: -4.0083, label: 'Abidjan Port, Cote d\'Ivoire' },
];

const CYCLE_DURATION_MS = 1000 * 60 * 60 * 24 * 18;

function readNumericField(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function updateAisPositionFromMessage(payload: unknown): void {
  if (!payload || typeof payload !== 'object') {
    return;
  }

  const root = payload as {
    Message?: {
      PositionReport?: Record<string, unknown>;
      StandardClassBPositionReport?: Record<string, unknown>;
      ExtendedClassBPositionReport?: Record<string, unknown>;
    };
  };

  const candidates = [
    root.Message?.PositionReport,
    root.Message?.StandardClassBPositionReport,
    root.Message?.ExtendedClassBPositionReport,
  ];

  for (const report of candidates) {
    if (!report) {
      continue;
    }

    const lat = readNumericField(report.Latitude ?? report.latitude);
    const lng = readNumericField(report.Longitude ?? report.longitude);
    const mmsi = readNumericField(report.UserID ?? report.MMSI ?? report.mmsi);

    if (lat === null || lng === null || mmsi === null) {
      continue;
    }

    liveAisPosition = {
      mmsi,
      lat,
      lng,
      lastSeen: new Date().toISOString(),
      sogKnots: readNumericField(report.Sog ?? report.sog),
      cogDegrees: readNumericField(report.Cog ?? report.cog),
    };

    return;
  }
}

function initializeAisStreamIfNeeded(): void {
  const { trackingMode, apiKey, mmsiList } = getTrackingConfig();

  if (trackingMode !== 'aisstream') {
    return;
  }

  if (!apiKey || mmsiList.length === 0) {
    // Keep this false so we can try again automatically when env is fixed.
    aisStreamInitialized = false;
    return;
  }

  if (aisSocket && (aisSocket.readyState === WebSocket.OPEN || aisSocket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  if (aisStreamInitialized) {
    return;
  }

  aisStreamInitialized = true;

  const connect = () => {
    console.log(`[AIS] Connecting to AISStream for MMSI: ${mmsiList.join(', ')}`);
    const socket = new WebSocket('wss://stream.aisstream.io/v0/stream');
    aisSocket = socket;

    socket.on('open', () => {
      console.log('[AIS] WebSocket open. Subscribing to stream.');
      const subscribeMessage = {
        APIKey: apiKey,
        // AISStream expects [lat, lon] pairs; using [lon, lat] gets rejected.
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FiltersShipMMSI: mmsiList,
        FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport', 'ExtendedClassBPositionReport'],
      };

      console.log(
        `[AIS] Sending subscription. keyLength=${apiKey.length}, mmsiCount=${mmsiList.length}`
      );

      socket.send(JSON.stringify(subscribeMessage));
    });

    socket.on('message', (rawData) => {
      try {
        const payload = JSON.parse(rawData.toString()) as unknown;

        if (
          payload &&
          typeof payload === 'object' &&
          !('Message' in (payload as Record<string, unknown>))
        ) {
          console.log('[AIS] Non-position payload:', payload);
        }

        updateAisPositionFromMessage(payload);

        if (liveAisPosition && !hasLoggedFirstLivePosition) {
          console.log(`[AIS] First live position received. MMSI=${liveAisPosition.mmsi}, lat=${liveAisPosition.lat}, lng=${liveAisPosition.lng}`);
          hasLoggedFirstLivePosition = true;
        }
      } catch (_error) {
        // Ignore malformed stream payloads and keep listening.
      }
    });

    socket.on('error', (error) => {
      console.error('[AIS] WebSocket error:', error.message);
    });

    socket.on('close', (code, reason) => {
      aisSocket = null;
      aisStreamInitialized = false;

      const reasonText = reason.toString() || 'no reason';
      console.warn(`[AIS] WebSocket closed (code=${code}, reason=${reasonText}). Reconnecting in 15s.`);

      if (aisReconnectTimer) {
        clearTimeout(aisReconnectTimer);
      }

      aisReconnectTimer = setTimeout(() => {
        initializeAisStreamIfNeeded();
      }, 15000);
    });
  };

  connect();
}

function getCurrentCargoState() {
  // HARDCODED LOCATION - Edit latitude and longitude below to manually update position
  // Example coordinates: Abidjan Port, Cote d'Ivoire
  const lat = -20.267722;   // <-- Change latitude here
  const lng = 55.648639;  // <-- Change longitude here
  const currentLabel = 'East Africa (Current)';  // <-- Change current location label here
  const nextLabel = 'Abidjan Port (Final)';
  const status = 'In Transit';
  const estimatedArrivalInDays = 15;

  return {
    info: {
      vesselName: 'Navios Nerine',
      origin: 'Guangzhou, China',
      destination: 'Abidjan, Cote d\'Ivoire',
      estimatedArrivalInDays,
      status,
      trackingMode: 'hardcoded',
      trackingState: 'hardcoded',
      trackedMmsi: null,
      lastAisUpdate: null,
    },
    location: {
      currentLabel,
      nextLabel,
      lat,
      lng,
      sogKnots: null,
      cogDegrees: null,
    },
  };
}

function readBearerToken(req: Request): string | null {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
    return;
  }

  const investor = investors.find(
    (item) => item.username.toLowerCase() === username.toLowerCase() && item.password === password
  );

  if (!investor) {
    res.status(401).json({ message: 'Invalid credentials.' });
    return;
  }

  const token = crypto.randomBytes(24).toString('hex');
  authTokens.set(token, investor.id);

  res.status(200).json({
    token,
    user: {
      firstName: investor.firstName,
      lastName: investor.lastName,
    },
  });
});

router.get('/home', (req: Request, res: Response): void => {
  const token = readBearerToken(req);

  if (!token) {
    res.status(401).json({ message: 'Missing auth token.' });
    return;
  }

  const investorId = authTokens.get(token);
  const investor = investors.find((item) => item.id === investorId);

  if (!investor) {
    res.status(401).json({ message: 'Invalid auth token.' });
    return;
  }

  const projectedProfit = Math.round(investor.initialInvestment * investor.expectedProfitRate);
  const projectedPayout = investor.initialInvestment + projectedProfit;

  res.status(200).json({
    investor: {
      firstName: investor.firstName,
      lastName: investor.lastName,
      initialInvestment: investor.initialInvestment,
      currency: investor.currency,
      projectedProfit,
      projectedPayout,
      expectedProfitRate: investor.expectedProfitRate,
    },
    cargo: getCurrentCargoState(),
  });
});

router.post('/logout', (req: Request, res: Response): void => {
  const token = readBearerToken(req);
  if (token) {
    authTokens.delete(token);
  }

  res.status(200).json({ message: 'Logged out.' });
});

export default router;
