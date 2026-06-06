import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import {
  requireAdmin,
  readBearerToken,
  upload,
  uploadToCloudinary,
  loginLimiter,
  capStr,
  normalizeDate,
  normalizeNumber,
  normalizeCurrency,
  normalizeVariants,
  normalizeImages,
  normalizeSocialLinks,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  BCRYPT_ROUNDS,
  SESSION_24_HOURS,
} from './middleware';
import { CargoModel } from '../../models/Cargo';
import { InvestorModel } from '../../models/Investor';
import { InvestmentModel } from '../../models/Investment';
import { SiteContentModel } from '../../models/SiteContent';
import { ContactRequestModel } from '../../models/ContactRequest';
import { SessionModel } from '../../models/Session';
import { AvatarModel } from '../../models/Avatar';
import { ProductModel } from '../../models/Product';
import { ProductOrderModel } from '../../models/ProductOrder';
import { PartnerModel } from '../../models/Partner';
import { BoutiqueModel } from '../../models/Boutique';

const router = Router();

// ---------------------------------------------------------------------------
// Admin — login / logout
// ---------------------------------------------------------------------------

router.post('/admin/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!ADMIN_PASSWORD) {
    res.status(503).json({ message: 'Admin access is not configured.' });
    return;
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.status(401).json({ message: 'Invalid admin credentials.' });
    return;
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_24_HOURS);
  await SessionModel.create({ token, userId: ADMIN_USERNAME, role: 'admin', expiresAt });

  res.status(200).json({
    token,
    user: { username: ADMIN_USERNAME, role: 'admin' },
  });
});

router.post('/admin/logout', async (req: Request, res: Response): Promise<void> => {
  const token = readBearerToken(req);
  if (token) {
    await SessionModel.deleteOne({ token, role: 'admin' });
  }
  res.status(200).json({ message: 'Logged out.' });
});

// ---------------------------------------------------------------------------
// Admin — file upload
// ---------------------------------------------------------------------------

router.post('/admin/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded.' });
    return;
  }

  try {
    const url = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    res.status(200).json({ url });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Upload to Cloudinary failed.' });
  }
});

// ---------------------------------------------------------------------------
// Admin — cargos
// ---------------------------------------------------------------------------

router.get('/admin/cargos', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const cargos = await CargoModel.find().sort({ createdAt: -1 }).lean();
  res.status(200).json({ cargos });
});

router.post('/admin/cargos', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

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
      shippingType,
      cargoDescription,
    } = req.body as Record<string, unknown>;

    const validShippingTypes = ['sea', 'air', 'land'];
    const normalizedShippingType = validShippingTypes.includes(String(shippingType || ''))
      ? (String(shippingType) as 'sea' | 'air' | 'land')
      : 'sea';

    const { storyText, storyMediaUrls } = req.body as { storyText?: string; storyMediaUrls?: string[] };
    const { hidden, coverImageUrl, purchaseDate } = req.body as { hidden?: boolean; coverImageUrl?: string; purchaseDate?: string };

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
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      shippingType: normalizedShippingType,
      cargoDescription: String(cargoDescription || '').trim(),
      story: {
        text: String(storyText || '').trim(),
        mediaUrls: Array.isArray(storyMediaUrls) ? storyMediaUrls.filter(Boolean) : [],
      },
      hidden: hidden === true,
      coverImageUrl: String(coverImageUrl || '').trim(),
      assignedInvestorIds: [],
    });

    res.status(201).json({ cargo });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create cargo.' });
  }
});

router.put('/admin/cargos/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { id } = req.params;
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
      shippingType,
      cargoDescription,
    } = req.body as Record<string, unknown>;

    const validShippingTypes = ['sea', 'air', 'land'];
    const normalizedShippingType = validShippingTypes.includes(String(shippingType || ''))
      ? (String(shippingType) as 'sea' | 'air' | 'land')
      : 'sea';

    const { storyText, storyMediaUrls } = req.body as { storyText?: string; storyMediaUrls?: string[] };
    const { hidden, coverImageUrl, purchaseDate } = req.body as { hidden?: boolean; coverImageUrl?: string; purchaseDate?: string };

    const cargo = await CargoModel.findByIdAndUpdate(
      id,
      {
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
        shippingType: normalizedShippingType,
        cargoDescription: String(cargoDescription || '').trim(),
        story: {
          text: String(storyText || '').trim(),
          mediaUrls: Array.isArray(storyMediaUrls) ? storyMediaUrls.filter(Boolean) : [],
        },
        hidden: hidden === true,
        coverImageUrl: String(coverImageUrl || '').trim(),
        ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined }),
      },
      { new: true, runValidators: true }
    );

    if (!cargo) {
      res.status(404).json({ message: 'Cargo not found.' });
      return;
    }

    res.status(200).json({ cargo });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update cargo.' });
  }
});

router.delete('/admin/cargos/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const cargo = await CargoModel.findByIdAndDelete(req.params.id);
    if (!cargo) {
      res.status(404).json({ message: 'Cargo not found.' });
      return;
    }
    res.status(200).json({ message: 'Cargo deleted.' });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete cargo.' });
  }
});

// ---------------------------------------------------------------------------
// Admin — investors
// ---------------------------------------------------------------------------

router.get('/admin/investors', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const investors = await InvestorModel.find().sort({ createdAt: -1 }).lean();
  const safeInvestors = investors.map((investor) => ({
    ...investor,
    assignedCargoIds: [],
    assignedInvestmentIds: investor.assignedInvestmentIds || [],
    currency: investor.currency || 'USD',
  }));
  res.status(200).json({ investors: safeInvestors });
});

router.post('/admin/investors', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const {
      name, username, password, investmentAmount, profitPercentageOnInvestment, currency, investmentIds, location,
    } = req.body as {
      name?: string; username?: string; password?: string; investmentAmount?: unknown;
      profitPercentageOnInvestment?: unknown; currency?: unknown; investmentIds?: string[]; location?: string;
    };

    const assignedInvestmentIds = Array.isArray(investmentIds) ? investmentIds.filter(Boolean) : [];
    const investment = normalizeNumber(investmentAmount, 'investmentAmount');
    const profitPercentage = normalizeNumber(profitPercentageOnInvestment, 'profitPercentageOnInvestment');
    const normalizedCurrency = normalizeCurrency(currency);
    const estimatedROI = Number(((investment * profitPercentage) / 100).toFixed(2));
    const hashedPassword = await bcrypt.hash(String(password || ''), BCRYPT_ROUNDS);

    const investor = await InvestorModel.create({
      name: String(name || '').trim(),
      displayName: String(name || '').trim(),
      username: String(username || '').trim().toLowerCase(),
      password: hashedPassword,
      investmentAmount: investment,
      profitPercentageOnInvestment: profitPercentage,
      estimatedROI,
      currency: normalizedCurrency,
      location: String(location || '').trim() || undefined,
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
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create investor.' });
  }
});

router.put('/admin/investors/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const {
      name, username, password, investmentAmount, profitPercentageOnInvestment, currency, investmentIds, location,
    } = req.body as {
      name?: string; username?: string; password?: string; investmentAmount?: unknown;
      profitPercentageOnInvestment?: unknown; currency?: unknown; investmentIds?: string[]; location?: string;
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
      location: String(location || '').trim() || undefined,
      assignedCargoIds: [],
      assignedInvestmentIds,
    };

    if (typeof password === 'string' && password.length > 0) {
      updatePayload.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    const investor = await InvestorModel.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true });

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
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update investor.' });
  }
});

router.delete('/admin/investors/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const investor = await InvestorModel.findByIdAndDelete(req.params.id);
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
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete investor.' });
  }
});

// ---------------------------------------------------------------------------
// Admin — dashboard
// ---------------------------------------------------------------------------

router.get('/admin/dashboard', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const [cargos, investors, investments, unreadContactCount, unreadOrderCount] = await Promise.all([
    CargoModel.find().sort({ createdAt: -1 }).lean(),
    InvestorModel.find().sort({ createdAt: -1 }).lean(),
    InvestmentModel.find().sort({ createdAt: -1 }).lean(),
    ContactRequestModel.countDocuments({ status: 'new' }),
    ProductOrderModel.countDocuments({ status: 'new' }),
  ]);

  const safeInvestors = investors.map((investor) => ({
    ...investor,
    assignedCargoIds: [],
    assignedInvestmentIds: investor.assignedInvestmentIds || [],
    currency: investor.currency || 'USD',
  }));

  res.status(200).json({ cargos, investors: safeInvestors, investments, unreadContactCount, unreadOrderCount });
});

// ---------------------------------------------------------------------------
// Admin — investments
// ---------------------------------------------------------------------------

router.post('/admin/investments', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { title, description, currency, minimumInvestment, cargoIds, status, currentStatus, hidden, coverImageUrl, location } = req.body as {
      title?: string; description?: string; currency?: unknown; minimumInvestment?: unknown;
      cargoIds?: string[]; status?: string; currentStatus?: string; hidden?: boolean; coverImageUrl?: string; location?: string;
    };

    const validStatuses = ['active', 'in_progress', 'waiting', 'successful'];
    const assignedCargoIds = Array.isArray(cargoIds) ? cargoIds.filter(Boolean) : [];
    const investment = await InvestmentModel.create({
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      currency: normalizeCurrency(currency),
      minimumInvestment: normalizeNumber(minimumInvestment, 'minimumInvestment'),
      cargoIds: assignedCargoIds,
      assignedInvestorIds: [],
      status: validStatuses.includes(String(status || '')) ? status : 'active',
      currentStatus: String(currentStatus || '').trim(),
      hidden: hidden === true,
      coverImageUrl: String(coverImageUrl || '').trim(),
      location: String(location || '').trim(),
    });

    res.status(201).json({ investment });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create investment.' });
  }
});

router.put('/admin/investments/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const { title, description, currency, minimumInvestment, cargoIds, status, currentStatus, hidden, coverImageUrl, location } = req.body as {
      title?: string; description?: string; currency?: unknown; minimumInvestment?: unknown;
      cargoIds?: string[]; status?: string; currentStatus?: string; hidden?: boolean; coverImageUrl?: string; location?: string;
    };

    const validStatuses = ['active', 'in_progress', 'waiting', 'successful'];
    const assignedCargoIds = Array.isArray(cargoIds) ? cargoIds.filter(Boolean) : [];
    const investment = await InvestmentModel.findByIdAndUpdate(
      id,
      {
        title: String(title || '').trim(),
        description: String(description || '').trim(),
        currency: normalizeCurrency(currency),
        minimumInvestment: normalizeNumber(minimumInvestment, 'minimumInvestment'),
        cargoIds: assignedCargoIds,
        currentStatus: String(currentStatus || '').trim(),
        hidden: hidden === true,
        coverImageUrl: String(coverImageUrl || '').trim(),
        location: String(location || '').trim(),
        ...(validStatuses.includes(String(status || '')) && { status }),
      },
      { new: true, runValidators: true }
    );

    if (!investment) {
      res.status(404).json({ message: 'Investment not found.' });
      return;
    }

    res.status(200).json({ investment });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update investment.' });
  }
});

router.delete('/admin/investments/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const investment = await InvestmentModel.findByIdAndDelete(req.params.id);
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
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete investment.' });
  }
});

// ---------------------------------------------------------------------------
// Admin — contact requests
// ---------------------------------------------------------------------------

router.get('/admin/contact-requests', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const requests = await ContactRequestModel.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ requests });
  } catch {
    res.status(500).json({ message: 'Failed to load contact requests.' });
  }
});

router.put('/admin/contact-requests/:id/status', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };

    if (!['new', 'read', 'contacted'].includes(status ?? '')) {
      res.status(400).json({ message: 'Invalid status.' });
      return;
    }

    const request = await ContactRequestModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!request) {
      res.status(404).json({ message: 'Request not found.' });
      return;
    }

    res.status(200).json({ request });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update status.' });
  }
});

// ---------------------------------------------------------------------------
// Admin — shop orders (inbox)
// ---------------------------------------------------------------------------

router.get('/admin/product-orders', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const orders = await ProductOrderModel.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ orders });
  } catch {
    res.status(500).json({ message: 'Failed to load orders.' });
  }
});

router.put('/admin/product-orders/:id/status', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };

    if (!['new', 'read', 'contacted'].includes(status ?? '')) {
      res.status(400).json({ message: 'Invalid status.' });
      return;
    }

    const order = await ProductOrderModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }

    res.status(200).json({ order });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update status.' });
  }
});

// ---------------------------------------------------------------------------
// Admin — site content
// ---------------------------------------------------------------------------

router.put('/admin/site-content/:key', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { key } = req.params;
    const { title, body, mediaUrls, links } = req.body as { title?: string; body?: string; mediaUrls?: string[]; links?: unknown };

    const content = await SiteContentModel.findOneAndUpdate(
      { key },
      {
        key,
        title: String(title || '').trim(),
        body: String(body || '').trim(),
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls.filter(Boolean) : [],
        links: normalizeSocialLinks(links),
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ content });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to save content.' });
  }
});

// ---------------------------------------------------------------------------
// Admin — avatar management
// ---------------------------------------------------------------------------

router.get('/admin/avatars', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const avatars = await AvatarModel.find().sort({ createdAt: 1 }).lean();
    res.status(200).json({ avatars });
  } catch {
    res.status(500).json({ message: 'Failed to load avatars.' });
  }
});

router.post('/admin/avatars', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const { name, imageUrl, defaultTheme, secret } = req.body as {
      name?: string; imageUrl?: string; defaultTheme?: number; secret?: boolean;
    };
    if (!name?.trim() || !imageUrl?.trim()) {
      res.status(400).json({ message: 'Name and imageUrl are required.' });
      return;
    }
    const avatar = await AvatarModel.create({
      name: name.trim(),
      imageUrl: imageUrl.trim(),
      defaultTheme: Number(defaultTheme ?? 0),
      secret: secret === true,
    });
    res.status(201).json({ avatar });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create avatar.' });
  }
});

router.put('/admin/avatars/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const { name, defaultTheme, secret } = req.body as { name?: string; defaultTheme?: number; secret?: boolean; };
    const avatar = await AvatarModel.findByIdAndUpdate(
      req.params.id,
      { name: String(name || '').trim(), defaultTheme: Number(defaultTheme ?? 0), secret: secret === true },
      { new: true }
    );
    if (!avatar) { res.status(404).json({ message: 'Avatar not found.' }); return; }
    res.status(200).json({ avatar });
  } catch {
    res.status(400).json({ message: 'Failed to update avatar.' });
  }
});

router.delete('/admin/avatars/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    await AvatarModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Avatar deleted.' });
  } catch {
    res.status(400).json({ message: 'Failed to delete avatar.' });
  }
});

// ---------------------------------------------------------------------------
// Admin — products
// ---------------------------------------------------------------------------

function buildProductPayload(body: Record<string, unknown>) {
  return {
    name: String(body['name'] || '').trim(),
    description: String(body['description'] || '').trim(),
    originStory: String(body['originStory'] || '').trim(),
    price: normalizeNumber(body['price'], 'price'),
    currency: normalizeCurrency(body['currency']),
    variants: normalizeVariants(body['variants']),
    stock: Number.isFinite(Number(body['stock'])) ? Math.max(0, Number(body['stock'])) : 0,
    coverImageUrl: String(body['coverImageUrl'] || '').trim(),
    images: normalizeImages(body['images']),
    section: body['section'] === 'artisanal' ? 'artisanal' : 'food',
    category: String(body['category'] || '').trim(),
    active: body['active'] !== false,
    boutiqueId: body['boutiqueId'] ? String(body['boutiqueId']).trim() : '',
  };
}

router.get('/admin/products', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const products = await ProductModel.find().sort({ position: 1, createdAt: -1 }).lean();
  res.status(200).json({ products });
});

router.put('/admin/products/reorder', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const { order } = req.body as { order: Array<{ id: string; position: number }> };
  if (!Array.isArray(order)) { res.status(400).json({ message: 'Invalid order payload.' }); return; }
  await ProductModel.bulkWrite(
    order.map(({ id, position }) => ({
      updateOne: { filter: { _id: id }, update: { $set: { position } } },
    }))
  );
  res.status(200).json({ message: 'Products reordered.' });
});

router.post('/admin/products', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const product = await ProductModel.create(buildProductPayload(req.body as Record<string, unknown>));
    res.status(201).json({ product });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create product.' });
  }
});

router.put('/admin/products/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const product = await ProductModel.findByIdAndUpdate(
      req.params.id,
      buildProductPayload(req.body as Record<string, unknown>),
      { new: true, runValidators: true }
    );
    if (!product) { res.status(404).json({ message: 'Product not found.' }); return; }
    res.status(200).json({ product });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update product.' });
  }
});

router.delete('/admin/products/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    await ProductModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Product deleted.' });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete product.' });
  }
});

// ---------------------------------------------------------------------------
// Admin — partners
// ---------------------------------------------------------------------------

function buildPartnerPayload(body: Record<string, unknown>) {
  return {
    name: String(body['name'] || '').trim(),
    logoUrl: String(body['logoUrl'] || '').trim(),
    title: String(body['title'] || '').trim(),
    description: String(body['description'] || '').trim(),
    active: body['active'] !== false,
  };
}

router.get('/admin/partners', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const partners = await PartnerModel.find().sort({ createdAt: 1 }).lean();
  res.status(200).json({ partners });
});

router.post('/admin/partners', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const payload = buildPartnerPayload(req.body as Record<string, unknown>);
    if (!payload.name) { res.status(400).json({ message: 'Partner name is required.' }); return; }
    const partner = await PartnerModel.create(payload);
    res.status(201).json({ partner });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create partner.' });
  }
});

router.put('/admin/partners/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const partner = await PartnerModel.findByIdAndUpdate(
      req.params.id,
      buildPartnerPayload(req.body as Record<string, unknown>),
      { new: true, runValidators: true }
    );
    if (!partner) { res.status(404).json({ message: 'Partner not found.' }); return; }
    res.status(200).json({ partner });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update partner.' });
  }
});

router.delete('/admin/partners/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    await PartnerModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Partner deleted.' });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete partner.' });
  }
});

// ---------------------------------------------------------------------------
// Admin — boutiques
// ---------------------------------------------------------------------------

function buildBoutiquePayload(body: Record<string, unknown>) {
  return {
    name: String(body['name'] || '').trim(),
    logoUrl: String(body['logoUrl'] || '').trim(),
    description: String(body['description'] || '').trim(),
    location: String(body['location'] || '').trim(),
    active: body['active'] !== false,
  };
}

router.get('/admin/boutiques', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const boutiques = await BoutiqueModel.find().sort({ createdAt: 1 }).lean();
  res.status(200).json({ boutiques });
});

router.post('/admin/boutiques', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const payload = buildBoutiquePayload(req.body as Record<string, unknown>);
    if (!payload.name) { res.status(400).json({ message: 'Boutique name is required.' }); return; }
    const boutique = await BoutiqueModel.create(payload);
    res.status(201).json({ boutique });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create boutique.' });
  }
});

router.put('/admin/boutiques/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const boutique = await BoutiqueModel.findByIdAndUpdate(
      req.params.id,
      buildBoutiquePayload(req.body as Record<string, unknown>),
      { new: true, runValidators: true }
    );
    if (!boutique) { res.status(404).json({ message: 'Boutique not found.' }); return; }
    res.status(200).json({ boutique });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to update boutique.' });
  }
});

router.delete('/admin/boutiques/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    await BoutiqueModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Boutique deleted.' });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete boutique.' });
  }
});

export default router;
