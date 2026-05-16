import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { CargoModel } from '../models/Cargo';
import { InvestorModel } from '../models/Investor';

const router = Router();

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin112233';

const adminTokens = new Map<string, string>();
const investorTokens = new Map<string, string>();

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

function requireAdmin(req: Request, res: Response): string | null {
  const token = readBearerToken(req);
  if (!token || !adminTokens.has(token)) {
    res.status(401).json({ message: 'Admin authentication required.' });
    return null;
  }

  return token;
}

function requireInvestor(req: Request, res: Response): string | null {
  const token = readBearerToken(req);
  if (!token || !investorTokens.has(token)) {
    res.status(401).json({ message: 'Investor authentication required.' });
    return null;
  }

  return token;
}

function normalizeDate(value: unknown): Date {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value.');
  }

  return date;
}

function normalizeNumber(value: unknown, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number.`);
  }

  return parsed;
}

router.post('/admin/login', (req: Request, res: Response): void => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.status(401).json({ message: 'Invalid admin credentials.' });
    return;
  }

  const token = crypto.randomBytes(24).toString('hex');
  adminTokens.set(token, ADMIN_USERNAME);

  res.status(200).json({
    token,
    user: { username: ADMIN_USERNAME, role: 'admin' },
  });
});

router.post('/admin/logout', (req: Request, res: Response): void => {
  const token = readBearerToken(req);
  if (token) {
    adminTokens.delete(token);
  }

  res.status(200).json({ message: 'Logged out.' });
});

router.get('/admin/cargos', (req: Request, res: Response): void => {
  if (!requireAdmin(req, res)) {
    return;
  }

  void CargoModel.find().sort({ createdAt: -1 }).lean().then((cargos) => {
    res.status(200).json({ cargos });
  });
});

router.post('/admin/cargos', async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) {
    return;
  }

  try {
    const {
      productBeingShipped,
      quantity,
      purchaseLocation,
      purchasePrice,
      shippingDestination,
      shippingPrice,
      otherExpenses,
      estimatedTimeOfArrival,
      estimatedTimeOfSelling,
    } = req.body as Record<string, unknown>;

    const cargo = await CargoModel.create({
      productBeingShipped: String(productBeingShipped || '').trim(),
      quantity: normalizeNumber(quantity, 'quantity'),
      purchaseLocation: String(purchaseLocation || '').trim(),
      purchasePrice: normalizeNumber(purchasePrice, 'purchasePrice'),
      shippingDestination: String(shippingDestination || '').trim(),
      shippingPrice: normalizeNumber(shippingPrice, 'shippingPrice'),
      otherExpenses: normalizeNumber(otherExpenses, 'otherExpenses'),
      estimatedTimeOfArrival: normalizeDate(estimatedTimeOfArrival),
      estimatedTimeOfSelling: normalizeDate(estimatedTimeOfSelling),
      assignedInvestorIds: [],
    });

    res.status(201).json({ cargo });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to create cargo.',
    });
  }
});

router.get('/admin/investors', (req: Request, res: Response): void => {
  if (!requireAdmin(req, res)) {
    return;
  }

  void InvestorModel.find().sort({ createdAt: -1 }).lean().then((investors) => {
    res.status(200).json({ investors });
  });
});

router.get('/admin/dashboard', async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) {
    return;
  }

  const [cargos, investors] = await Promise.all([
    CargoModel.find().sort({ createdAt: -1 }).lean(),
    InvestorModel.find().sort({ createdAt: -1 }).lean(),
  ]);

  res.status(200).json({ cargos, investors });
});

router.post('/admin/investors', async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) {
    return;
  }

  try {
    const {
      name,
      username,
      password,
      investmentAmount,
      profitPercentageOnInvestment,
      cargoIds,
    } = req.body as {
      name?: string;
      username?: string;
      password?: string;
      investmentAmount?: unknown;
      profitPercentageOnInvestment?: unknown;
      cargoIds?: string[];
    };

    const assignedCargoIds = Array.isArray(cargoIds) ? cargoIds.filter(Boolean) : [];
    const investment = normalizeNumber(investmentAmount, 'investmentAmount');
    const profitPercentage = normalizeNumber(profitPercentageOnInvestment, 'profitPercentageOnInvestment');
    const estimatedROI = Number(((investment * profitPercentage) / 100).toFixed(2));

    const investor = await InvestorModel.create({
      name: String(name || '').trim(),
      username: String(username || '').trim().toLowerCase(),
      password: String(password || ''),
      investmentAmount: investment,
      profitPercentageOnInvestment: profitPercentage,
      estimatedROI,
      assignedCargoIds,
    });

    if (assignedCargoIds.length > 0) {
      await CargoModel.updateMany(
        { _id: { $in: assignedCargoIds } },
        { $addToSet: { assignedInvestorIds: investor._id } }
      );
    }

    res.status(201).json({ investor });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to create investor.',
    });
  }
});

router.post('/investor/login', async (req: Request, res: Response): Promise<void> => {
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
    res.status(401).json({ message: 'Invalid investor credentials.' });
    return;
  }

  const token = crypto.randomBytes(24).toString('hex');
  investorTokens.set(token, String(investor._id));

  res.status(200).json({
    token,
    user: {
      name: investor.name,
      username: investor.username,
    },
  });
});

router.get('/investor/home', async (req: Request, res: Response): Promise<void> => {
  const token = requireInvestor(req, res);
  if (!token) {
    return;
  }

  const investorId = investorTokens.get(token);
  const investor = await InvestorModel.findById(investorId).lean();

  if (!investor) {
    res.status(401).json({ message: 'Invalid investor token.' });
    return;
  }

  const cargos = await CargoModel.find({ _id: { $in: investor.assignedCargoIds || [] } }).sort({ createdAt: -1 }).lean();

  res.status(200).json({
    investor: {
      name: investor.name,
      username: investor.username,
      investmentAmount: investor.investmentAmount,
      profitPercentageOnInvestment: investor.profitPercentageOnInvestment,
      estimatedROI: investor.estimatedROI,
    },
    cargos,
  });
});

router.post('/investor/logout', (req: Request, res: Response): void => {
  const token = readBearerToken(req);
  if (token) {
    investorTokens.delete(token);
  }

  res.status(200).json({ message: 'Logged out.' });
});

export default router;
