import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Readable } from 'stream';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { CargoModel } from '../models/Cargo';
import { InvestorModel } from '../models/Investor';
import { InvestmentModel } from '../models/Investment';
import { SiteContentModel } from '../models/SiteContent';
import { ContactRequestModel } from '../models/ContactRequest';
import { SessionModel } from '../models/Session';
import { AvatarModel } from '../models/Avatar';
import { ProductModel, ProductVariant } from '../models/Product';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer = require('nodemailer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    if (/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed.'));
    }
  },
});

function uploadToCloudinary(buffer: Buffer, originalname: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const resourceType: 'image' | 'video' = /\.(mp4|webm|mov)$/i.test(originalname) ? 'video' : 'image';
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'home/nomadme', resource_type: resourceType },
      (error, result) => {
        if (error ?? !result) reject(error ?? new Error('Upload failed'));
        else resolve(result!.secure_url);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

const router = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin112233';

const BCRYPT_ROUNDS = 12;
const SESSION_7_DAYS = 7 * 24 * 60 * 60 * 1000;
const SESSION_24_HOURS = 24 * 60 * 60 * 1000;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function readBearerToken(req: Request): string | null {
  const authHeader = req.header('Authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const token = readBearerToken(req);
  if (!token) {
    res.status(401).json({ message: 'Admin authentication required.' });
    return false;
  }
  const session = await SessionModel.findOne({
    token,
    role: 'admin',
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!session) {
    res.status(401).json({ message: 'Admin authentication required.' });
    return false;
  }
  return true;
}

async function requireInvestor(req: Request, res: Response): Promise<string | null> {
  const token = readBearerToken(req);
  if (!token) {
    res.status(401).json({ message: 'Investor authentication required.' });
    return null;
  }
  const session = await SessionModel.findOne({
    token,
    role: 'investor',
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!session) {
    res.status(401).json({ message: 'Investor authentication required.' });
    return null;
  }
  return String(session.userId);
}

function normalizeDate(value: unknown): Date {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date value.');
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
  return String(value || '').trim();
}

function normalizeVariants(value: unknown): ProductVariant[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      const raw = v as { label?: unknown; price?: unknown };
      const label = String(raw?.label ?? '').trim();
      const price = Number(raw?.price);
      if (!label) return null;
      return { label, price: Number.isFinite(price) && price >= 0 ? price : 0 };
    })
    .filter((v): v is ProductVariant => v !== null);
}

function normalizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((u) => String(u || '').trim()).filter(Boolean).slice(0, 4);
}

// Best-effort admin notification for a new product order. Never throws —
// an SMTP hiccup must not fail the customer's order acknowledgement.
async function sendOrderNotification(order: {
  productName: string;
  variant: string;
  quantity: number;
  unitPrice: string;
  fullName: string;
  email: string;
  country: string;
  message: string;
}): Promise<void> {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.qiye.aliyun.com',
      port: 465,
      secureConnection: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const lines = [
      '🛒 New NomadMee shop order',
      '',
      `Product:  ${order.productName}`,
      order.variant ? `Variant:  ${order.variant}` : '',
      `Quantity: ${order.quantity}`,
      order.unitPrice ? `Unit:     ${order.unitPrice}` : '',
      '',
      `Name:     ${order.fullName}`,
      `Email:    ${order.email}`,
      `Country:  ${order.country}`,
      order.message ? `Message:  ${order.message}` : '',
    ].filter(Boolean).join('\n');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: order.email || undefined,
      subject: `🛒 Order — ${order.productName} (${order.fullName})`,
      text: lines,
    });
  } catch (error) {
    console.error('Failed to send order notification email:', error);
  }
}

const LEGACY_AVATAR_URLS: Record<string, string> = {
  popeye: '/assets/popeyesmall.png',
  olive: '/assets/olive1.jpeg',
  curto: '/assets/cortomaltese.png',
};

// ---------------------------------------------------------------------------
// Public — no auth required
// ---------------------------------------------------------------------------

router.get('/public/map-data', async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();

    const [investors, cargos, investmentCount, allInvestors, investorInvestmentCounts, avatarDocs] = await Promise.all([
      InvestorModel.find({ kycCompleted: true }).select('displayName name avatar location').lean(),
      CargoModel.find({ hidden: { $ne: true } }).select('productBeingShipped shippingType purchaseLocation shippingDestination estimatedTimeOfArrival createdAt purchaseDate').lean(),
      InvestmentModel.countDocuments({ hidden: { $ne: true } }),
      InvestorModel.find().select('investmentAmount profitPercentageOnInvestment').lean(),
      InvestmentModel.aggregate<{ _id: string; count: number }>([
        { $unwind: '$assignedInvestorIds' },
        { $group: { _id: { $toString: '$assignedInvestorIds' }, count: { $sum: 1 } } },
      ]),
      AvatarModel.find().select('imageUrl').lean(),
    ]);
    const dbAvatarMap = new Map((avatarDocs as Array<{ _id: unknown; imageUrl: string }>).map((a) => [String(a._id), a.imageUrl]));

    const totalInvested = allInvestors.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0);
    const totalExpectedProfit = allInvestors.reduce(
      (sum, inv) => sum + ((inv.investmentAmount || 0) * (inv.profitPercentageOnInvestment || 0)) / 100,
      0
    );

    const activeInvestments = await InvestmentModel.find({ status: { $ne: 'successful' }, hidden: { $ne: true } }).select('title status currency minimumInvestment cargoIds assignedInvestorIds location').lean();
    const activeCargoIds = new Set(activeInvestments.flatMap((inv) => inv.cargoIds.map(String)));
    const activeCargos = cargos.filter((c) => activeCargoIds.has(String(c._id)));
    const cargoDestMap = Object.fromEntries(cargos.map((c) => [String(c._id), c.shippingDestination]));
    const cargoPurchaseMap = Object.fromEntries(cargos.map((c) => [String(c._id), c.purchaseLocation]));

    const activeShipments = activeCargos.filter(
      (c) => c.createdAt != null && c.createdAt <= now && new Date(c.estimatedTimeOfArrival) >= now
    ).length;

    const investmentCountMap = Object.fromEntries(
      investorInvestmentCounts.map((r) => [r._id, r.count])
    );

    res.status(200).json({
      investors: investors.map((inv) => {
        const avatarKey = inv.avatar || '';
        const avatarImageUrl = dbAvatarMap.get(avatarKey) || LEGACY_AVATAR_URLS[avatarKey] || '/logo192.png';
        return {
          name: inv.displayName || inv.name,
          avatar: avatarKey,
          avatarImageUrl,
          location: inv.location || '',
          investmentCount: investmentCountMap[String(inv._id)] ?? 0,
        };
      }),
      cargos: activeCargos.map((c) => ({
        _id: c._id,
        productBeingShipped: c.productBeingShipped,
        shippingType: c.shippingType || 'sea',
        purchaseLocation: c.purchaseLocation,
        shippingDestination: c.shippingDestination,
        estimatedTimeOfArrival: c.estimatedTimeOfArrival,
        purchaseDate: c.purchaseDate ?? c.createdAt,
        createdAt: c.createdAt,
      })),
      investments: activeInvestments.map((inv) => {
        const cargoFallback = inv.cargoIds.map((id) => cargoPurchaseMap[String(id)]).find(Boolean) ?? '';
        const invDoc = inv as typeof inv & { location?: string };
        return {
          _id: inv._id,
          title: inv.title,
          status: inv.status || 'active',
          currency: inv.currency,
          minimumInvestment: inv.minimumInvestment,
          cargoCount: inv.cargoIds.length,
          investorCount: inv.assignedInvestorIds.length,
          location: invDoc.location || cargoFallback,
        };
      }),
      stats: {
        totalInvested: Math.round(totalInvested),
        totalExpectedProfit: Math.round(totalExpectedProfit),
        activeInvestments: investmentCount,
        activeShipments,
      },
    });
  } catch {
    res.status(500).json({ message: 'Failed to load map data.' });
  }
});

router.get('/public/investments', async (_req: Request, res: Response): Promise<void> => {
  try {
    const investments = await InvestmentModel.find({ status: { $ne: 'successful' }, hidden: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      investments: investments.map((inv) => ({
        _id: inv._id,
        title: inv.title,
        description: inv.description,
        currency: inv.currency,
        minimumInvestment: inv.minimumInvestment,
        status: inv.status || 'active',
        cargoCount: inv.cargoIds?.length ?? 0,
        investorCount: inv.assignedInvestorIds?.length ?? 0,
        coverImageUrl: inv.coverImageUrl || '',
      })),
    });
  } catch {
    res.status(500).json({ message: 'Failed to load investments.' });
  }
});

router.get('/public/avatars', async (_req: Request, res: Response): Promise<void> => {
  try {
    const avatars = await AvatarModel.find().sort({ createdAt: 1 }).lean();
    res.status(200).json({
      avatars: avatars.map((a) => ({
        _id: a._id,
        name: a.name,
        imageUrl: a.imageUrl,
        defaultTheme: a.defaultTheme ?? 0,
        secret: a.secret ?? false,
      })),
    });
  } catch {
    res.status(500).json({ message: 'Failed to load avatars.' });
  }
});

router.get('/public/site-content/:key', async (req: Request, res: Response): Promise<void> => {
  try {
    const content = await SiteContentModel.findOne({ key: req.params.key }).lean();
    res.status(200).json({ content: content ?? { key: req.params.key, title: '', body: '', mediaUrls: [] } });
  } catch {
    res.status(500).json({ message: 'Failed to load content.' });
  }
});

router.post('/public/contact-request', async (req: Request, res: Response): Promise<void> => {
  try {
    const { investmentId, investmentTitle, fullName, contactMethod, contactDetail, rdvDate, note } =
      req.body as Record<string, string>;

    if (!fullName?.trim() || !contactMethod || !contactDetail?.trim() || !rdvDate?.trim() || !investmentId) {
      res.status(400).json({ message: 'All fields are required.' });
      return;
    }

    if (!['whatsapp', 'email'].includes(contactMethod)) {
      res.status(400).json({ message: 'Invalid contact method.' });
      return;
    }

    const investment = await InvestmentModel.findById(investmentId).lean();

    const request = await ContactRequestModel.create({
      investmentId: investmentId.trim(),
      investmentTitle: (investmentTitle || investment?.title || 'Unknown Investment').trim(),
      fullName: fullName.trim(),
      contactMethod,
      contactDetail: contactDetail.trim(),
      rdvDate: rdvDate.trim(),
      note: (note ?? '').trim(),
      status: 'new',
    });

    res.status(201).json({ request: { _id: request._id } });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to submit request.' });
  }
});

// ---------------------------------------------------------------------------
// Public — shop products
// ---------------------------------------------------------------------------

function mapPublicProduct(p: Record<string, unknown> & { _id: unknown }) {
  return {
    _id: p['_id'],
    name: p['name'],
    description: p['description'] ?? '',
    originStory: p['originStory'] ?? '',
    price: p['price'],
    currency: p['currency'],
    variants: Array.isArray(p['variants']) ? p['variants'] : [],
    stock: p['stock'] ?? 0,
    coverImageUrl: p['coverImageUrl'] ?? '',
    images: Array.isArray(p['images']) ? p['images'] : [],
    category: p['category'] ?? '',
  };
}

router.get('/public/products', async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await ProductModel.find({ active: true }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ products: products.map((p) => mapPublicProduct(p as never)) });
  } catch {
    res.status(500).json({ message: 'Failed to load products.' });
  }
});

router.post('/public/product-order', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, variant, quantity, fullName, email, country, message } =
      req.body as Record<string, string>;

    if (!productId || !fullName?.trim() || !email?.trim() || !country?.trim()) {
      res.status(400).json({ message: 'Name, email and country are required.' });
      return;
    }

    const product = await ProductModel.findById(productId).lean();
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const qty = Math.max(1, Math.min(9999, Number(quantity) || 1));
    const chosen = (product.variants || []).find((v) => v.label === variant);
    const unit = chosen ? chosen.price : product.price;
    const unitPrice = `${unit} ${product.currency}`;

    await sendOrderNotification({
      productName: product.name,
      variant: (variant || '').trim(),
      quantity: qty,
      unitPrice,
      fullName: fullName.trim(),
      email: email.trim(),
      country: country.trim(),
      message: (message ?? '').trim(),
    });

    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to submit order.' });
  }
});

// ---------------------------------------------------------------------------
// Admin — login / logout
// ---------------------------------------------------------------------------

router.post('/admin/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

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
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to create cargo.',
    });
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
    const { id } = req.params;
    const cargo = await CargoModel.findByIdAndDelete(id);

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
      name,
      username,
      password,
      investmentAmount,
      profitPercentageOnInvestment,
      currency,
      investmentIds,
      location,
    } = req.body as {
      name?: string;
      username?: string;
      password?: string;
      investmentAmount?: unknown;
      profitPercentageOnInvestment?: unknown;
      currency?: unknown;
      investmentIds?: string[];
      location?: string;
    };

    const assignedInvestmentIds = Array.isArray(investmentIds) ? investmentIds.filter(Boolean) : [];
    const investment = normalizeNumber(investmentAmount, 'investmentAmount');
    const profitPercentage = normalizeNumber(profitPercentageOnInvestment, 'profitPercentageOnInvestment');
    const normalizedCurrency = normalizeCurrency(currency);
    const estimatedROI = Number(((investment * profitPercentage) / 100).toFixed(2));

    const plainPassword = String(password || '');
    const hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

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
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to create investor.',
    });
  }
});

router.put('/admin/investors/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

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
      location,
    } = req.body as {
      name?: string;
      username?: string;
      password?: string;
      investmentAmount?: unknown;
      profitPercentageOnInvestment?: unknown;
      currency?: unknown;
      investmentIds?: string[];
      location?: string;
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
  if (!await requireAdmin(req, res)) return;

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

// ---------------------------------------------------------------------------
// Admin — dashboard
// ---------------------------------------------------------------------------

router.get('/admin/dashboard', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  const [cargos, investors, investments, unreadContactCount] = await Promise.all([
    CargoModel.find().sort({ createdAt: -1 }).lean(),
    InvestorModel.find().sort({ createdAt: -1 }).lean(),
    InvestmentModel.find().sort({ createdAt: -1 }).lean(),
    ContactRequestModel.countDocuments({ status: 'new' }),
  ]);

  const safeInvestors = investors.map((investor) => ({
    ...investor,
    assignedCargoIds: [],
    assignedInvestmentIds: investor.assignedInvestmentIds || [],
    currency: investor.currency || 'USD',
  }));

  res.status(200).json({ cargos, investors: safeInvestors, investments, unreadContactCount });
});

// ---------------------------------------------------------------------------
// Admin — investments
// ---------------------------------------------------------------------------

router.post('/admin/investments', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { title, description, currency, minimumInvestment, cargoIds, status, hidden, coverImageUrl, location } = req.body as {
      title?: string; description?: string; currency?: unknown; minimumInvestment?: unknown;
      cargoIds?: string[]; status?: string; hidden?: boolean; coverImageUrl?: string; location?: string;
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
      hidden: hidden === true,
      coverImageUrl: String(coverImageUrl || '').trim(),
      location: String(location || '').trim(),
    });

    res.status(201).json({ investment });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to create investment.',
    });
  }
});

router.put('/admin/investments/:id', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const { title, description, currency, minimumInvestment, cargoIds, status, hidden, coverImageUrl, location } = req.body as {
      title?: string; description?: string; currency?: unknown; minimumInvestment?: unknown;
      cargoIds?: string[]; status?: string; hidden?: boolean; coverImageUrl?: string; location?: string;
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
// Admin — site content
// ---------------------------------------------------------------------------

router.put('/admin/site-content/:key', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;

  try {
    const { key } = req.params;
    const { title, body, mediaUrls } = req.body as { title?: string; body?: string; mediaUrls?: string[] };

    const content = await SiteContentModel.findOneAndUpdate(
      { key },
      {
        key,
        title: String(title || '').trim(),
        body: String(body || '').trim(),
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls.filter(Boolean) : [],
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
    const { name, defaultTheme, secret } = req.body as {
      name?: string; defaultTheme?: number; secret?: boolean;
    };
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
    const normalizedDisplayName = String(displayName || '').trim() || 'Future investor';
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
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to complete KYC.',
    });
  }
});

// ---------------------------------------------------------------------------
// Investor — shop products (auth required)
// ---------------------------------------------------------------------------

router.get('/investor/products', async (req: Request, res: Response): Promise<void> => {
  const investorId = await requireInvestor(req, res);
  if (!investorId) return;
  try {
    const products = await ProductModel.find({ active: true }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ products: products.map((p) => mapPublicProduct(p as never)) });
  } catch {
    res.status(500).json({ message: 'Failed to load products.' });
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
    category: String(body['category'] || '').trim(),
    active: body['active'] !== false,
  };
}

router.get('/admin/products', async (req: Request, res: Response): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const products = await ProductModel.find().sort({ createdAt: -1 }).lean();
  res.status(200).json({ products });
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
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }
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

export default router;
