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
  ADMIN_USERNAME,
  ADMIN_PASSWORD_HASH,
  BCRYPT_ROUNDS,
  SESSION_24_HOURS,
} from './middleware';
import {
  CargoBody,
  InvestorBody,
  InvestmentBody,
  ProductBody,
  SiteContentBody,
  PartnerBody,
  BoutiqueBody,
  BundleBody,
  JourneyBody,
  zodErr,
} from './schemas';
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
import { BundleModel } from '../../models/Bundle';
import { JourneyModel } from '../../models/Journey';

const router = Router();

// ---------------------------------------------------------------------------
// Admin — login / logout
// ---------------------------------------------------------------------------

router.post('/admin/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  const hash = await ADMIN_PASSWORD_HASH;
  if (!hash) {
    res.status(503).json({ message: 'Admin access is not configured.' });
    return;
  }

  const passwordOk = typeof password === 'string' && await bcrypt.compare(password, hash);
  if (username !== ADMIN_USERNAME || !passwordOk) {
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
    const b = CargoBody.parse(req.body);
    const cargo = await CargoModel.create({
      productBeingShipped: b.productBeingShipped,
      quantity:            b.quantity,
      purchaseLocation:    b.purchaseLocation,
      purchasePrice:       b.purchasePrice,
      currency:            b.currency,
      shippingDestination: b.shippingDestination,
      shippingPrice:       b.shippingPrice,
      otherExpenses:       b.otherExpenses,
      estimatedTimeOfArrival: b.estimatedTimeOfArrival,
      estimatedTimeOfSelling: b.estimatedTimeOfSelling,
      purchaseDate:        b.purchaseDate,
      shippingType:        b.shippingType,
      cargoDescription:    b.cargoDescription,
      story: { text: b.storyText, mediaUrls: b.storyMediaUrls },
      hidden:              b.hidden,
      coverImageUrl:       b.coverImageUrl,
      assignedInvestorIds: [],
    });
    res.status(201).json({ cargo });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to create cargo.') });
  }
});

router.put('/admin/cargos/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const b = CargoBody.parse(req.body);
    const cargo = await CargoModel.findByIdAndUpdate(
      id,
      {
        productBeingShipped: b.productBeingShipped,
        quantity:            b.quantity,
        purchaseLocation:    b.purchaseLocation,
        purchasePrice:       b.purchasePrice,
        currency:            b.currency,
        shippingDestination: b.shippingDestination,
        shippingPrice:       b.shippingPrice,
        otherExpenses:       b.otherExpenses,
        estimatedTimeOfArrival: b.estimatedTimeOfArrival,
        estimatedTimeOfSelling: b.estimatedTimeOfSelling,
        shippingType:        b.shippingType,
        cargoDescription:    b.cargoDescription,
        story: { text: b.storyText, mediaUrls: b.storyMediaUrls },
        hidden:              b.hidden,
        coverImageUrl:       b.coverImageUrl,
        ...(b.purchaseDate !== undefined && { purchaseDate: b.purchaseDate }),
      },
      { new: true, runValidators: true }
    );

    if (!cargo) {
      res.status(404).json({ message: 'Cargo not found.' });
      return;
    }

    res.status(200).json({ cargo });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to update cargo.') });
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
    const b = InvestorBody.parse(req.body);
    const estimatedROI = Number(((b.investmentAmount * b.profitPercentageOnInvestment) / 100).toFixed(2));
    const hashedPassword = await bcrypt.hash(b.password ?? '', BCRYPT_ROUNDS);

    const investor = await InvestorModel.create({
      name:                         b.name,
      displayName:                  b.name,
      username:                     b.username,
      password:                     hashedPassword,
      investmentAmount:             b.investmentAmount,
      profitPercentageOnInvestment: b.profitPercentageOnInvestment,
      estimatedROI,
      currency:                     b.currency,
      location:                     b.location || undefined,
      kycCompleted:                 false,
      assignedCargoIds:             [],
      assignedInvestmentIds:        b.investmentIds,
    });

    if (b.investmentIds.length > 0) {
      await InvestmentModel.updateMany(
        { _id: { $in: b.investmentIds } },
        { $addToSet: { assignedInvestorIds: investor._id } }
      );
    }

    res.status(201).json({ investor });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to create investor.') });
  }
});

router.put('/admin/investors/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const b = InvestorBody.parse(req.body);
    const estimatedROI = Number(((b.investmentAmount * b.profitPercentageOnInvestment) / 100).toFixed(2));

    const updatePayload: Record<string, unknown> = {
      name:                         b.name,
      displayName:                  b.name,
      username:                     b.username,
      investmentAmount:             b.investmentAmount,
      profitPercentageOnInvestment: b.profitPercentageOnInvestment,
      estimatedROI,
      currency:                     b.currency,
      location:                     b.location || undefined,
      assignedCargoIds:             [],
      assignedInvestmentIds:        b.investmentIds,
    };

    if (b.password && b.password.length > 0) {
      updatePayload.password = await bcrypt.hash(b.password, BCRYPT_ROUNDS);
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

    if (b.investmentIds.length > 0) {
      await InvestmentModel.updateMany(
        { _id: { $in: b.investmentIds } },
        { $addToSet: { assignedInvestorIds: investor._id } }
      );
    }

    res.status(200).json({ investor });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to update investor.') });
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
// Admin — registered users (self-registered, not manually created)
// ---------------------------------------------------------------------------

router.get('/admin/registered-users', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const users = await InvestorModel.find({
    registrationMethod: { $in: ['email', 'google'] },
  }).sort({ createdAt: -1 }).lean();

  const safeUsers = users.map((u) => ({
    _id: u._id,
    name: u.name,
    username: u.username,
    email: u.email,
    emailVerified: u.emailVerified,
    googleId: u.googleId ? '(linked)' : null,
    registrationMethod: u.registrationMethod,
    accountStatus: u.accountStatus,
    assignedInvestmentIds: u.assignedInvestmentIds || [],
    kycCompleted: u.kycCompleted,
    createdAt: u.createdAt,
  }));

  res.status(200).json({ users: safeUsers });
});

router.put('/admin/registered-users/:id/status', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const { status } = req.body as { status?: string };
  const validStatuses = ['active', 'suspended', 'pending_verification'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ message: 'Invalid status.' });
    return;
  }

  const user = await InvestorModel.findByIdAndUpdate(
    req.params.id,
    { accountStatus: status },
    { new: true }
  ).lean();

  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  res.status(200).json({ message: 'Status updated.' });
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
    const b = InvestmentBody.parse(req.body);
    const investment = await InvestmentModel.create({
      title:             b.title,
      description:       b.description,
      currency:          b.currency,
      minimumInvestment: b.minimumInvestment,
      cargoIds:          b.cargoIds,
      assignedInvestorIds: [],
      status:            b.status,
      currentStatus:     b.currentStatus,
      hidden:            b.hidden,
      coverImageUrl:     b.coverImageUrl,
      location:          b.location,
    });
    res.status(201).json({ investment });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to create investment.') });
  }
});

router.put('/admin/investments/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const b = InvestmentBody.parse(req.body);
    const investment = await InvestmentModel.findByIdAndUpdate(
      id,
      {
        title:             b.title,
        description:       b.description,
        currency:          b.currency,
        minimumInvestment: b.minimumInvestment,
        cargoIds:          b.cargoIds,
        currentStatus:     b.currentStatus,
        hidden:            b.hidden,
        coverImageUrl:     b.coverImageUrl,
        location:          b.location,
        status:            b.status,
      },
      { new: true, runValidators: true }
    );

    if (!investment) {
      res.status(404).json({ message: 'Investment not found.' });
      return;
    }

    res.status(200).json({ investment });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to update investment.') });
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
    const b = SiteContentBody.parse(req.body);
    const content = await SiteContentModel.findOneAndUpdate(
      { key },
      { key, title: b.title, body: b.body, mediaUrls: b.mediaUrls, links: b.links },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ content });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to save content.') });
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
    const payload = ProductBody.parse(req.body);
    const product = await ProductModel.create(payload);
    res.status(201).json({ product });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to create product.') });
  }
});

router.put('/admin/products/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const payload = ProductBody.parse(req.body);
    const product = await ProductModel.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!product) { res.status(404).json({ message: 'Product not found.' }); return; }
    res.status(200).json({ product });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to update product.') });
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

router.get('/admin/partners', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const partners = await PartnerModel.find().sort({ createdAt: 1 }).lean();
  res.status(200).json({ partners });
});

router.post('/admin/partners', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const payload = PartnerBody.parse(req.body);
    const partner = await PartnerModel.create(payload);
    res.status(201).json({ partner });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to create partner.') });
  }
});

router.put('/admin/partners/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const payload = PartnerBody.parse(req.body);
    const partner = await PartnerModel.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!partner) { res.status(404).json({ message: 'Partner not found.' }); return; }
    res.status(200).json({ partner });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to update partner.') });
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

router.get('/admin/boutiques', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const boutiques = await BoutiqueModel.find().sort({ createdAt: 1 }).lean();
  res.status(200).json({ boutiques });
});

router.post('/admin/boutiques', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const payload = BoutiqueBody.parse(req.body);
    const boutique = await BoutiqueModel.create(payload);
    res.status(201).json({ boutique });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to create boutique.') });
  }
});

router.put('/admin/boutiques/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const payload = BoutiqueBody.parse(req.body);
    const boutique = await BoutiqueModel.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!boutique) { res.status(404).json({ message: 'Boutique not found.' }); return; }
    res.status(200).json({ boutique });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to update boutique.') });
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

// ---------------------------------------------------------------------------
// Admin — bundles
// ---------------------------------------------------------------------------

router.get('/admin/bundles', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const bundles = await BundleModel.find().sort({ position: 1, createdAt: -1 }).lean();
  res.status(200).json({ bundles });
});

router.put('/admin/bundles/reorder', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const { order } = req.body as { order: Array<{ id: string; position: number }> };
  if (!Array.isArray(order)) { res.status(400).json({ message: 'Invalid order payload.' }); return; }
  await BundleModel.bulkWrite(
    order.map(({ id, position }) => ({
      updateOne: { filter: { _id: id }, update: { $set: { position } } },
    }))
  );
  res.status(200).json({ message: 'Bundles reordered.' });
});

router.post('/admin/bundles', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const payload = BundleBody.parse(req.body);
    const bundle = await BundleModel.create(payload);
    res.status(201).json({ bundle });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to create bundle.') });
  }
});

router.put('/admin/bundles/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const payload = BundleBody.parse(req.body);
    const bundle = await BundleModel.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!bundle) { res.status(404).json({ message: 'Bundle not found.' }); return; }
    res.status(200).json({ bundle });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to update bundle.') });
  }
});

router.delete('/admin/bundles/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    await BundleModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Bundle deleted.' });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete bundle.' });
  }
});

// ---------------------------------------------------------------------------
// Admin — journeys
// ---------------------------------------------------------------------------

router.get('/admin/journeys', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const journeys = await JourneyModel.find().sort({ createdAt: -1 }).lean();
  res.status(200).json({ journeys });
});

router.post('/admin/journeys', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const b = JourneyBody.parse(req.body);
    const journey = await JourneyModel.create(b);
    res.status(201).json({ journey });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to create journey.') });
  }
});

router.put('/admin/journeys/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    const b = JourneyBody.parse(req.body);
    const journey = await JourneyModel.findByIdAndUpdate(
      req.params.id,
      { $set: b },
      { new: true, runValidators: true }
    ).lean();
    if (!journey) { res.status(404).json({ message: 'Journey not found.' }); return; }
    res.status(200).json({ journey });
  } catch (error) {
    res.status(400).json({ message: zodErr(error, 'Failed to update journey.') });
  }
});

router.delete('/admin/journeys/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  try {
    await JourneyModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Journey deleted.' });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete journey.' });
  }
});

export default router;
