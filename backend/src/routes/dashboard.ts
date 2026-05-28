import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getLatestTrackedShips } from '../services/aisStreamSnapshotJob';
import { InvestorModel } from '../models/Investor';

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

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
    return;
  }

  const investor = await InvestorModel.findOne({
    username: username.trim().toLowerCase(),
    password,
  }).lean();

  if (!investor) {
    res.status(401).json({ message: 'Invalid credentials.' });
    return;
  }

  const token = crypto.randomBytes(24).toString('hex');
  authTokens.set(token, String(investor._id));

  const nameParts = String(investor.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  res.status(200).json({
    token,
    user: {
      firstName,
      lastName,
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
  if (!investorId) {
    res.status(401).json({ message: 'Invalid auth token.' });
    return;
  }

  const investor = await InvestorModel.findById(investorId).lean();
  if (!investor) {
    res.status(401).json({ message: 'Invalid auth token.' });
    return;
  }

  const profitRate = investor.profitPercentageOnInvestment / 100;
  const projectedProfit = Math.round(investor.investmentAmount * profitRate);
  const projectedPayout = investor.investmentAmount + projectedProfit;
  const { mmsiList } = getTrackingConfig();
  const latestShips = await getLatestTrackedShips(mmsiList);

  const nameParts = String(investor.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  res.status(200).json({
    investor: {
      firstName,
      lastName,
      initialInvestment: investor.investmentAmount,
      currency: investor.currency || 'USD',
      projectedProfit,
      projectedPayout,
      expectedProfitRate: profitRate,
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
