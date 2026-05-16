import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getLatestTrackedShips } from '../services/aisStreamSnapshotJob';

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

const router = Router();
const authTokens = new Map<string, string>();

function getTrackingConfig(): {
  mmsiList: string[];
} {
  const mmsiList = (process.env.AISSTREAM_MMSI || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return { mmsiList: mmsiList.filter((value) => /^\d+$/.test(value)) };
}

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

router.get('/home', async (req: Request, res: Response): Promise<void> => {

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
  const { mmsiList } = getTrackingConfig();
  const latestShips = await getLatestTrackedShips(mmsiList);

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
    aisstream: {
      receivedAt: latestShips[0]?.collectedAt?.toISOString?.() || null,
      raw: latestShips,
      rawText: null,
      hasData: latestShips.length > 0,
      isLoading: latestShips.length === 0,
      trackedMmsiList: mmsiList,
      ships: latestShips,
    },
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
