import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { CargoModel } from '../models/Cargo';
import { InvestorModel } from '../models/Investor';
import { InvestmentModel } from '../models/Investment';

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

function normalizeCurrency(value: unknown): string {
  const currency = String(value || '').trim().toUpperCase();
  const supported = ['USD', 'EUR', 'TND', 'CNY'];

  if (!supported.includes(currency)) {
    throw new Error(`Currency must be one of: ${supported.join(', ')}`);
  }

  return currency;
}

function normalizeAvatar(value: unknown): string {
  const avatar = String(value || '').trim().toLowerCase();
  const supported = ['popeye', 'olive', 'curto'];

  if (!supported.includes(avatar)) {
    throw new Error(`Avatar must be one of: ${supported.join(', ')}`);
  }

  return avatar;
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
      currency,
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
      currency: normalizeCurrency(currency),
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
    const safeInvestors = investors.map((investor) => ({
      ...investor,
      assignedCargoIds: [],
      assignedInvestmentIds: investor.assignedInvestmentIds || [],
      currency: investor.currency || 'USD',
    }));
    res.status(200).json({ investors: safeInvestors });
  });
});

router.get('/admin/dashboard', async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) {
    return;
  }

  const [cargos, investors, investments] = await Promise.all([
    CargoModel.find().sort({ createdAt: -1 }).lean(),
    InvestorModel.find().sort({ createdAt: -1 }).lean(),
    InvestmentModel.find().sort({ createdAt: -1 }).lean(),
  ]);

  const safeInvestors = investors.map((investor) => ({
    ...investor,
    assignedCargoIds: [],
    assignedInvestmentIds: investor.assignedInvestmentIds || [],
    currency: investor.currency || 'USD',
  }));

  res.status(200).json({ cargos, investors: safeInvestors, investments });
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
      currency,
      investmentIds,
    } = req.body as {
      name?: string;
      username?: string;
      password?: string;
      investmentAmount?: unknown;
      profitPercentageOnInvestment?: unknown;
      currency?: unknown;
      investmentIds?: string[];
    };

    const assignedInvestmentIds = Array.isArray(investmentIds) ? investmentIds.filter(Boolean) : [];
    const investment = normalizeNumber(investmentAmount, 'investmentAmount');
    const profitPercentage = normalizeNumber(profitPercentageOnInvestment, 'profitPercentageOnInvestment');
    const normalizedCurrency = normalizeCurrency(currency);
    const estimatedROI = Number(((investment * profitPercentage) / 100).toFixed(2));

    const investor = await InvestorModel.create({
      name: String(name || '').trim(),
      displayName: String(name || '').trim(),
      username: String(username || '').trim().toLowerCase(),
      password: String(password || ''),
      investmentAmount: investment,
      profitPercentageOnInvestment: profitPercentage,
      estimatedROI,
      currency: normalizedCurrency,
      kycCompleted: false,
      assignedCargoIds: [],
      assignedInvestmentIds,
    });

    if (assignedInvestmentIds.length > 0) {
      await InvestmentModel.updateMany(
        { _id: { $in: assignedInvestmentIds } },
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

router.put('/admin/investors/:id', async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) {
    return;
  }

  try {
    const { id } = req.params;
    const {
      name,
      username,
      password,
      investmentAmount,
      profitPercentageOnInvestment,
      currency,
      investmentIds,
    } = req.body as {
      name?: string;
      username?: string;
      password?: string;
      investmentAmount?: unknown;
      profitPercentageOnInvestment?: unknown;
      currency?: unknown;
      investmentIds?: string[];
    };

    const assignedInvestmentIds = Array.isArray(investmentIds) ? investmentIds.filter(Boolean) : [];
    const investment = normalizeNumber(investmentAmount, 'investmentAmount');
    const profitPercentage = normalizeNumber(profitPercentageOnInvestment, 'profitPercentageOnInvestment');
    const normalizedCurrency = normalizeCurrency(currency);
    const estimatedROI = Number(((investment * profitPercentage) / 100).toFixed(2));

    const updatePayload: Record<string, unknown> = {
      name: String(name || '').trim(),
      displayName: String(name || '').trim(),
      username: String(username || '').trim().toLowerCase(),
      investmentAmount: investment,
      profitPercentageOnInvestment: profitPercentage,
      estimatedROI,
      currency: normalizedCurrency,
      assignedCargoIds: [],
      assignedInvestmentIds,
    };

    if (typeof password === 'string' && password.length > 0) {
      updatePayload.password = password;
    }

    const investor = await InvestorModel.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!investor) {
      res.status(404).json({ message: 'Investor not found.' });
      return;
    }

    await InvestmentModel.updateMany(
      { assignedInvestorIds: investor._id },
      { $pull: { assignedInvestorIds: investor._id } }
    );

    if (assignedInvestmentIds.length > 0) {
      await InvestmentModel.updateMany(
        { _id: { $in: assignedInvestmentIds } },
        { $addToSet: { assignedInvestorIds: investor._id } }
      );
    }

    res.status(200).json({ investor });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to update investor.',
    });
  }
});

router.delete('/admin/investors/:id', async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) {
    return;
  }

  try {
    const { id } = req.params;
    const investor = await InvestorModel.findByIdAndDelete(id);

    if (!investor) {
      res.status(404).json({ message: 'Investor not found.' });
      return;
    }

    await InvestmentModel.updateMany(
      { assignedInvestorIds: investor._id },
      { $pull: { assignedInvestorIds: investor._id } }
    );

    res.status(200).json({ message: 'Investor deleted.' });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to delete investor.',
    });
  }
});

router.post('/admin/investments', async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) {
    return;
  }

  try {
    const { title, description, currency, minimumInvestment, cargoIds } = req.body as {
      title?: string;
      description?: string;
      currency?: unknown;
      minimumInvestment?: unknown;
      cargoIds?: string[];
    };

    const assignedCargoIds = Array.isArray(cargoIds) ? cargoIds.filter(Boolean) : [];
    const investment = await InvestmentModel.create({
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      currency: normalizeCurrency(currency),
      minimumInvestment: normalizeNumber(minimumInvestment, 'minimumInvestment'),
      cargoIds: assignedCargoIds,
      assignedInvestorIds: [],
    });

    res.status(201).json({ investment });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to create investment.',
    });
  }
});

router.put('/admin/investments/:id', async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) {
    return;
  }

  try {
    const { id } = req.params;
    const { title, description, currency, minimumInvestment, cargoIds } = req.body as {
      title?: string;
      description?: string;
      currency?: unknown;
      minimumInvestment?: unknown;
      cargoIds?: string[];
    };

    const assignedCargoIds = Array.isArray(cargoIds) ? cargoIds.filter(Boolean) : [];
    const investment = await InvestmentModel.findByIdAndUpdate(
      id,
      {
        title: String(title || '').trim(),
        description: String(description || '').trim(),
        currency: normalizeCurrency(currency),
        minimumInvestment: normalizeNumber(minimumInvestment, 'minimumInvestment'),
        cargoIds: assignedCargoIds,
      },
      { new: true, runValidators: true }
    );

    if (!investment) {
      res.status(404).json({ message: 'Investment not found.' });
      return;
    }

    res.status(200).json({ investment });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to update investment.',
    });
  }
});

router.delete('/admin/investments/:id', async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) {
    return;
  }

  try {
    const { id } = req.params;
    const investment = await InvestmentModel.findByIdAndDelete(id);

    if (!investment) {
      res.status(404).json({ message: 'Investment not found.' });
      return;
    }

    await InvestorModel.updateMany(
      { assignedInvestmentIds: investment._id },
      { $pull: { assignedInvestmentIds: investment._id } }
    );

    res.status(200).json({ message: 'Investment deleted.' });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to delete investment.',
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

  const assignedInvestments = await InvestmentModel.find({ assignedInvestorIds: investor._id }).lean();
  const cargoIds = Array.from(new Set(assignedInvestments.flatMap((investment) => investment.cargoIds || [])));
  const cargos = await CargoModel.find({ _id: { $in: cargoIds } }).sort({ createdAt: -1 }).lean();

  res.status(200).json({
    investor: {
      name: investor.name,
      displayName: investor.displayName || investor.name,
      username: investor.username,
      investmentAmount: investor.investmentAmount,
      profitPercentageOnInvestment: investor.profitPercentageOnInvestment,
      estimatedROI: investor.estimatedROI,
      currency: investor.currency || 'USD',
      avatar: investor.avatar,
      kycCompleted: investor.kycCompleted === true,
    },
    cargos,
  });
});

router.post('/investor/kyc', async (req: Request, res: Response): Promise<void> => {
  const token = requireInvestor(req, res);
  if (!token) {
    return;
  }

  try {
    const investorId = investorTokens.get(token);
    const { avatar, displayName } = req.body as { avatar?: unknown; displayName?: unknown };

    const normalizedAvatar = normalizeAvatar(avatar);
    const normalizedDisplayName = String(displayName || '').trim() || 'Future investor';

    const investor = await InvestorModel.findByIdAndUpdate(
      investorId,
      {
        $set: {
          avatar: normalizedAvatar,
          displayName: normalizedDisplayName,
          kycCompleted: true,
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!investor) {
      res.status(401).json({ message: 'Invalid investor token.' });
      return;
    }

    res.status(200).json({
      investor: {
        _id: investor._id,
        name: investor.name,
        displayName: investor.displayName || investor.name,
        username: investor.username,
        investmentAmount: investor.investmentAmount,
        profitPercentageOnInvestment: investor.profitPercentageOnInvestment,
        estimatedROI: investor.estimatedROI,
        currency: investor.currency || 'USD',
        avatar: investor.avatar,
        kycCompleted: investor.kycCompleted === true,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to complete KYC.',
    });
  }
});

router.post('/investor/logout', (req: Request, res: Response): void => {
  const token = readBearerToken(req);
  if (token) {
    investorTokens.delete(token);
  }

  res.status(200).json({ message: 'Logged out.' });
});

export default router;
