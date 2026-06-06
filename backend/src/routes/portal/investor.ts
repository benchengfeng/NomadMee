import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import {
  requireInvestor,
  readBearerToken,
  loginLimiter,
  capStr,
  normalizeAvatar,
  BCRYPT_ROUNDS,
  SESSION_7_DAYS,
  loadShopGalleries,
  mapPublicProduct,
} from './middleware';
import { InvestorModel } from '../../models/Investor';
import { InvestmentModel } from '../../models/Investment';
import { CargoModel } from '../../models/Cargo';
import { SessionModel } from '../../models/Session';
import { ProductModel } from '../../models/Product';

const router = Router();

// ---------------------------------------------------------------------------
// Investor — login / logout
// ---------------------------------------------------------------------------

router.post('/investor/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
    return;
  }

  const investor = await InvestorModel.findOne({
    username: username.trim().toLowerCase(),
  }).lean();

  if (!investor) {
    res.status(401).json({ message: 'Invalid investor credentials.' });
    return;
  }

  // Auto-migrate plain-text passwords to bcrypt on first successful login
  const isHashed = investor.password.startsWith('$2b$') || investor.password.startsWith('$2a$');
  let passwordValid: boolean;

  if (isHashed) {
    passwordValid = await bcrypt.compare(password, investor.password);
  } else {
    passwordValid = investor.password === password;
    if (passwordValid) {
      const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await InvestorModel.updateOne({ _id: investor._id }, { password: hashed });
    }
  }

  if (!passwordValid) {
    res.status(401).json({ message: 'Invalid investor credentials.' });
    return;
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_7_DAYS);
  await SessionModel.create({ token, userId: String(investor._id), role: 'investor', expiresAt });

  res.status(200).json({
    token,
    user: {
      name: investor.name,
      username: investor.username,
    },
  });
});

router.post('/investor/logout', async (req: Request, res: Response): Promise<void> => {
  const token = readBearerToken(req);
  if (token) {
    await SessionModel.deleteOne({ token, role: 'investor' });
  }
  res.status(200).json({ message: 'Logged out.' });
});

// ---------------------------------------------------------------------------
// Investor — password change
// ---------------------------------------------------------------------------

router.post('/investor/change-password', async (req: Request, res: Response): Promise<void> => {
  const investorId = await requireInvestor(req, res);
  if (!investorId) return;
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current and new passwords are required.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters.' });
      return;
    }
    const investor = await InvestorModel.findById(investorId);
    if (!investor) { res.status(404).json({ message: 'Investor not found.' }); return; }
    const isValid = await bcrypt.compare(currentPassword, investor.password);
    if (!isValid) { res.status(400).json({ message: 'Current password is incorrect.' }); return; }
    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await InvestorModel.updateOne({ _id: investor._id }, { password: hashed });
    res.status(200).json({ message: 'Password updated successfully.' });
  } catch {
    res.status(500).json({ message: 'Failed to update password.' });
  }
});

// ---------------------------------------------------------------------------
// Investor — home & KYC
// ---------------------------------------------------------------------------

router.get('/investor/home', async (req: Request, res: Response): Promise<void> => {
  const investorId = await requireInvestor(req, res);
  if (!investorId) return;

  const investor = await InvestorModel.findById(investorId).lean();

  if (!investor) {
    res.status(401).json({ message: 'Invalid investor token.' });
    return;
  }

  const assignedInvestments = await InvestmentModel.find({ assignedInvestorIds: investor._id, hidden: { $ne: true } }).lean();
  const cargoIds = Array.from(new Set(assignedInvestments.flatMap((investment) => investment.cargoIds || [])));
  const cargos = await CargoModel.find({ _id: { $in: cargoIds }, hidden: { $ne: true } }).sort({ createdAt: -1 }).lean();

  res.status(200).json({
    investor: {
      name: investor.name,
      displayName: investor.displayName || investor.name,
      username: investor.username,
      investmentAmount: investor.investmentAmount,
      profitPercentageOnInvestment: investor.profitPercentageOnInvestment,
      estimatedROI: investor.estimatedROI,
      currency: investor.currency || 'USD',
      preferredCurrency: investor.preferredCurrency || investor.currency || 'USD',
      avatar: investor.avatar,
      kycCompleted: investor.kycCompleted === true,
    },
    cargos,
    investments: assignedInvestments.map((inv) => ({
      _id: inv._id,
      title: inv.title,
      currentStatus: inv.currentStatus || '',
    })),
  });
});

router.post('/investor/kyc', async (req: Request, res: Response): Promise<void> => {
  const investorId = await requireInvestor(req, res);
  if (!investorId) return;

  try {
    const { avatar, displayName, preferredCurrency } = req.body as {
      avatar?: unknown;
      displayName?: unknown;
      preferredCurrency?: unknown;
    };

    const normalizedAvatar = normalizeAvatar(avatar);
    const normalizedDisplayName = capStr(displayName, 80) || 'Future investor';
    const validCurrencies = ['USD', 'EUR', 'TND', 'CNY'];
    const normalizedCurrency = validCurrencies.includes(String(preferredCurrency || '').toUpperCase())
      ? String(preferredCurrency).toUpperCase()
      : undefined;

    const investor = await InvestorModel.findByIdAndUpdate(
      investorId,
      {
        $set: {
          avatar: normalizedAvatar,
          displayName: normalizedDisplayName,
          kycCompleted: true,
          ...(normalizedCurrency && { preferredCurrency: normalizedCurrency }),
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
        preferredCurrency: investor.preferredCurrency || investor.currency || 'USD',
        avatar: investor.avatar,
        kycCompleted: investor.kycCompleted === true,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to complete KYC.' });
  }
});

// ---------------------------------------------------------------------------
// Investor — shop products (auth required)
// ---------------------------------------------------------------------------

router.get('/investor/products', async (req: Request, res: Response): Promise<void> => {
  const investorId = await requireInvestor(req, res);
  if (!investorId) return;
  try {
    const [products, galleries] = await Promise.all([
      ProductModel.find({ active: true }).sort({ createdAt: -1 }).lean(),
      loadShopGalleries(),
    ]);
    res.status(200).json({ products: products.map((p) => mapPublicProduct(p as never)), galleries });
  } catch {
    res.status(500).json({ message: 'Failed to load products.' });
  }
});

export default router;
