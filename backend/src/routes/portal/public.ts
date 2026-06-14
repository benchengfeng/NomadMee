import { Router, Request, Response } from 'express';
import {
  publicWriteLimiter,
  capStr,
  isHoneypotTripped,
  SITE_ORIGIN,
  FALLBACK_IMAGE,
  escapeHtml,
  LEGACY_AVATAR_URLS,
  loadShopGalleries,
  mapPublicProduct,
} from './middleware';
import { CargoModel } from '../../models/Cargo';
import { InvestorModel } from '../../models/Investor';
import { InvestmentModel } from '../../models/Investment';
import { SiteContentModel } from '../../models/SiteContent';
import { ContactRequestModel } from '../../models/ContactRequest';
import { AvatarModel } from '../../models/Avatar';
import { ProductModel } from '../../models/Product';
import { ProductOrderModel } from '../../models/ProductOrder';
import { PartnerModel } from '../../models/Partner';
import { BoutiqueModel } from '../../models/Boutique';
import { BundleModel } from '../../models/Bundle';
import { JourneyModel } from '../../models/Journey';
import { JourneyInterestBody, zodErr } from './schemas';

const router = Router();

// ---------------------------------------------------------------------------
// Public — OG prerender for social bots
// ---------------------------------------------------------------------------

/**
 * Returns a minimal HTML page with product-specific OG/Twitter meta tags.
 * Nginx routes social bot traffic for /shop/:id here; real browsers get the SPA.
 * Add to nginx (inside the `server {}` block, before the generic `location /`):
 *
 *   map $http_user_agent $is_social_bot {
 *       default 0;
 *       ~*(bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|telegrambot|whatsapp|slackbot|discordbot) 1;
 *   }
 *   location ~ "^/shop/[a-fA-F0-9]{24}$" {
 *       if ($is_social_bot) {
 *           proxy_pass http://127.0.0.1:8000;
 *           rewrite ^/shop/(.+)$ /api/portal/public/og/shop/$1 break;
 *       }
 *       try_files $uri /index.html;
 *   }
 */
router.get('/public/og/shop/:productId', async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await ProductModel.findById(req.params.productId)
      .select('name description coverImageUrl price currency active')
      .lean();

    const productUrl = `${SITE_ORIGIN}/shop/${req.params.productId}`;

    const title = product
      ? `${product.name} — nomadme Shop`
      : 'nomadme Shop — Authentic West African Products';

    const description = product?.description
      ? product.description.slice(0, 200)
      : 'Authentic West African products shipped worldwide — tiger nuts, djembes, spices, and more.';

    const image = product?.coverImageUrl || FALLBACK_IMAGE;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="product" />
  <meta property="og:url" content="${escapeHtml(productUrl)}" />
  <meta property="og:site_name" content="nomadme" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:alt" content="${escapeHtml(product?.name ?? 'nomadme product')}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(productUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(productUrl)}">${escapeHtml(title)}</a>…</p>
</body>
</html>`);
  } catch {
    res.status(404).send('<!DOCTYPE html><html><head><title>nomadme</title></head><body>Product not found.</body></html>');
  }
});

// ---------------------------------------------------------------------------
// Public — no auth required
// ---------------------------------------------------------------------------

router.get('/public/map-data', async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();

    const [investors, cargos, investmentCount, allInvestors, investorInvestmentCounts, avatarDocs, boutiques, activeJourneys, geoPartners] = await Promise.all([
      InvestorModel.find({ kycCompleted: true }).select('displayName name avatar location').lean(),
      CargoModel.find({ hidden: { $ne: true } }).select('productBeingShipped shippingType purchaseLocation shippingDestination estimatedTimeOfArrival createdAt purchaseDate').lean(),
      InvestmentModel.countDocuments({ hidden: { $ne: true } }),
      InvestorModel.find().select('investmentAmount profitPercentageOnInvestment').lean(),
      InvestmentModel.aggregate<{ _id: string; count: number }>([
        { $unwind: '$assignedInvestorIds' },
        { $group: { _id: { $toString: '$assignedInvestorIds' }, count: { $sum: 1 } } },
      ]),
      AvatarModel.find().select('imageUrl').lean(),
      BoutiqueModel.find({ active: true }).select('name logoUrl description location').lean(),
      JourneyModel.find({ status: { $in: ['active', 'full'] } }).select('title tagline location locationLat locationLng spotsRemaining status coverImageUrl').lean(),
      PartnerModel.find({ active: true, locationLat: { $ne: null }, locationLng: { $ne: null } }).select('name logoUrl location locationLat locationLng').lean(),
    ]);
    const dbAvatarMap = new Map((avatarDocs as Array<{ _id: unknown; imageUrl: string }>).map((a) => [String(a._id), a.imageUrl]));

    const totalInvested = allInvestors.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0);
    const totalExpectedProfit = allInvestors.reduce(
      (sum, inv) => sum + ((inv.investmentAmount || 0) * (inv.profitPercentageOnInvestment || 0)) / 100,
      0
    );

    const activeInvestments = await InvestmentModel.find({ status: { $ne: 'successful' }, hidden: { $ne: true } }).select('title status currency minimumInvestment cargoIds assignedInvestorIds location').lean();
    const activeCargoIds = new Set(activeInvestments.flatMap((inv) => inv.cargoIds.map(String)));
    const cargoPurchaseMap = Object.fromEntries(cargos.map((c) => [String(c._id), c.purchaseLocation]));

    // All non-hidden cargos appear on the map, not just investment-linked ones.
    const activeShipments = cargos.filter(
      (c) => c.createdAt != null && c.createdAt <= now && new Date(c.estimatedTimeOfArrival) >= now
    ).length;

    // Unique countries: deduplicate purchaseLocation + shippingDestination across all cargos.
    const locationSet = new Set<string>();
    for (const c of cargos) {
      if (c.purchaseLocation) locationSet.add(c.purchaseLocation.trim());
      if (c.shippingDestination) locationSet.add(c.shippingDestination.trim());
    }
    const countryCount = locationSet.size;

    const investorCount = allInvestors.length;
    const journeyCount = activeJourneys.length;

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
      cargos: cargos.map((c) => ({
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
      boutiques: boutiques.map((b) => ({
        _id: b._id,
        name: b.name,
        logoUrl: b.logoUrl || '',
        description: b.tagline || '',
        location: b.location || '',
      })),
      journeys: activeJourneys.map((j) => ({
        _id: j._id,
        title: j.title,
        tagline: j.tagline || '',
        location: j.location || '',
        locationLat: j.locationLat ?? 0,
        locationLng: j.locationLng ?? 0,
        spotsRemaining: j.spotsRemaining ?? 0,
        status: j.status,
        coverImageUrl: j.coverImageUrl || '',
      })),
      partners: geoPartners.map((p) => ({
        _id: p._id,
        name: p.name,
        logoUrl: p.logoUrl || '',
        location: p.location || '',
        locationLat: (p as typeof p & { locationLat?: number }).locationLat ?? 0,
        locationLng: (p as typeof p & { locationLng?: number }).locationLng ?? 0,
      })),
      stats: {
        totalInvested: Math.round(totalInvested),
        totalExpectedProfit: Math.round(totalExpectedProfit),
        activeInvestments: investmentCount,
        activeShipments,
        countryCount,
        investorCount,
        journeyCount,
        boutiqueCount: boutiques.length,
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
        location: inv.location || '',
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
    res.status(200).json({ content: content ?? { key: req.params.key, title: '', body: '', mediaUrls: [], links: [] } });
  } catch {
    res.status(500).json({ message: 'Failed to load content.' });
  }
});

router.get('/public/partners', async (_req: Request, res: Response): Promise<void> => {
  try {
    const partners = await PartnerModel.find({ active: true }).sort({ createdAt: 1 }).lean();
    res.status(200).json({
      partners: partners.map((p) => ({
        _id: p._id,
        name: p.name,
        logoUrl: p.logoUrl,
        title: p.title,
        description: p.description,
      })),
    });
  } catch {
    res.status(500).json({ message: 'Failed to load partners.' });
  }
});

router.post('/public/contact-request', publicWriteLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    // Silently swallow honeypot hits — return a success shape so bots can't tell.
    if (isHoneypotTripped(req)) {
      res.status(201).json({ request: { _id: 'ok' } });
      return;
    }

    const { type, investmentId, investmentTitle, fullName, contactMethod, contactDetail, rdvDate, note } =
      req.body as Record<string, string>;

    if (!fullName?.trim() || !contactMethod || !contactDetail?.trim()) {
      res.status(400).json({ message: 'Name, contact method, and contact detail are required.' });
      return;
    }

    if (!['whatsapp', 'email'].includes(contactMethod)) {
      res.status(400).json({ message: 'Invalid contact method.' });
      return;
    }

    const isInvestment = type !== 'contact_us' && !!investmentId;

    if (isInvestment && !rdvDate?.trim()) {
      res.status(400).json({ message: 'Meeting date is required for investment enquiries.' });
      return;
    }

    let resolvedTitle = investmentTitle;
    if (isInvestment && !resolvedTitle) {
      const investment = await InvestmentModel.findById(String(investmentId)).lean();
      resolvedTitle = investment?.title ?? 'Unknown Investment';
    }

    const contactRequest = await ContactRequestModel.create({
      type: isInvestment ? 'investment' : 'contact_us',
      ...(isInvestment && { investmentId: capStr(investmentId!, 64), investmentTitle: capStr(resolvedTitle!, 200) }),
      fullName: capStr(fullName, 120),
      contactMethod,
      contactDetail: capStr(contactDetail, 200),
      ...(rdvDate?.trim() && { rdvDate: capStr(rdvDate, 64) }),
      note: capStr(note ?? '', 2000),
      status: 'new',
    });

    res.status(201).json({ request: { _id: contactRequest._id } });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to submit request.' });
  }
});

router.get('/public/products', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [products, galleries, rawBundles] = await Promise.all([
      ProductModel.find({ active: true }).sort({ position: 1, createdAt: -1 }).lean(),
      loadShopGalleries(),
      BundleModel.find({ active: true }).sort({ position: 1, createdAt: -1 }).lean(),
    ]);

    // resolve product names for each bundle's included products
    const allIds = rawBundles.flatMap((b) => b.productIds);
    const nameMap = new Map<string, string>();
    if (allIds.length > 0) {
      const prods = await ProductModel.find({ _id: { $in: allIds } }).select('name').lean();
      for (const p of prods) nameMap.set(p._id.toString(), p.name as string);
    }

    const bundles = rawBundles.map((b) => ({
      _id: b._id.toString(),
      name: b.name,
      imageUrl: b.imageUrl,
      description: b.description,
      price: b.price,
      currency: b.currency,
      position: b.position,
      section: b.section ?? 'food',
      includedProducts: b.productIds.map((id) => ({ _id: id, name: nameMap.get(id) ?? '?' })),
    }));

    res.status(200).json({ products: products.map((p) => mapPublicProduct(p as never)), galleries, bundles });
  } catch {
    res.status(500).json({ message: 'Failed to load products.' });
  }
});

router.post('/public/product-order', publicWriteLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    // Silently swallow honeypot hits — return a success shape so bots can't tell.
    if (isHoneypotTripped(req)) {
      res.status(201).json({ ok: true, order: { _id: 'ok' } });
      return;
    }

    const { productId, variant, quantity, fullName, contactMethod, contactDetail, country, message } =
      req.body as Record<string, string>;

    if (!productId || !fullName?.trim() || !contactDetail?.trim() || !country?.trim()) {
      res.status(400).json({ message: 'Name, contact detail and country are required.' });
      return;
    }

    if (!['whatsapp', 'email'].includes(contactMethod)) {
      res.status(400).json({ message: 'Invalid contact method.' });
      return;
    }

    const product = await ProductModel.findById(String(productId)).lean();
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const qty = Math.max(1, Math.min(9999, Number(quantity) || 1));
    const chosen = (product.variants || []).find((v) => v.label === variant);
    const unit = chosen ? chosen.price : product.price;

    const order = await ProductOrderModel.create({
      productId: String(productId),
      productName: product.name,
      variant: capStr(variant, 120),
      quantity: qty,
      unitPrice: unit,
      currency: product.currency,
      total: unit * qty,
      fullName: capStr(fullName, 120),
      contactMethod,
      contactDetail: capStr(contactDetail, 200),
      country: capStr(country, 80),
      message: capStr(message, 2000),
      status: 'new',
    });

    res.status(201).json({ ok: true, order: { _id: order._id } });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to submit order.' });
  }
});

router.post('/public/bundle-order', publicWriteLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    if (isHoneypotTripped(req)) {
      res.status(201).json({ ok: true, order: { _id: 'ok' } });
      return;
    }

    const { bundleId, quantity, fullName, contactMethod, contactDetail, country, message } =
      req.body as Record<string, string>;

    if (!bundleId || !fullName?.trim() || !contactDetail?.trim() || !country?.trim()) {
      res.status(400).json({ message: 'Name, contact detail and country are required.' });
      return;
    }

    if (!['whatsapp', 'email'].includes(contactMethod)) {
      res.status(400).json({ message: 'Invalid contact method.' });
      return;
    }

    const bundle = await BundleModel.findById(String(bundleId)).lean();
    if (!bundle) {
      res.status(404).json({ message: 'Bundle not found.' });
      return;
    }

    const qty = Math.max(1, Math.min(99, Number(quantity) || 1));

    const order = await ProductOrderModel.create({
      productId: String(bundleId),
      productName: `📦 Bundle: ${bundle.name}`,
      variant: '',
      quantity: qty,
      unitPrice: bundle.price,
      currency: bundle.currency,
      total: bundle.price * qty,
      fullName: capStr(fullName, 120),
      contactMethod,
      contactDetail: capStr(contactDetail, 200),
      country: capStr(country, 80),
      message: capStr(message, 2000),
      status: 'new',
    });

    res.status(201).json({ ok: true, order: { _id: order._id } });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to submit bundle order.' });
  }
});

// ---------------------------------------------------------------------------
// Public — journeys
// ---------------------------------------------------------------------------

router.get('/public/journeys', async (_req: Request, res: Response): Promise<void> => {
  try {
    const journeys = await JourneyModel.find({ status: { $in: ['active', 'full'] } })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ journeys });
  } catch {
    res.status(500).json({ message: 'Failed to load journeys.' });
  }
});

router.get('/public/journeys/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const journey = await JourneyModel.findById(req.params.id).lean();
    if (!journey || (journey.status === 'draft')) {
      res.status(404).json({ message: 'Journey not found.' });
      return;
    }
    res.status(200).json({ journey });
  } catch {
    res.status(500).json({ message: 'Failed to load journey.' });
  }
});

router.post('/public/journey-interest', publicWriteLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    if (isHoneypotTripped(req)) {
      res.status(201).json({ ok: true });
      return;
    }

    const parsed = JourneyInterestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: zodErr(parsed.error, 'Invalid submission.') });
      return;
    }

    const { journeyId, journeyTitle, fullName, contactMethod, contactDetail, preferredDuration, preferredDates, note } = parsed.data;

    let resolvedTitle = journeyTitle;
    if (!resolvedTitle && journeyId) {
      const journey = await JourneyModel.findById(journeyId).lean();
      resolvedTitle = journey?.title ?? '';
    }

    const contactRequest = await ContactRequestModel.create({
      type: 'journey_interest',
      journeyId:        capStr(journeyId, 64),
      journeyTitle:     capStr(resolvedTitle, 200),
      fullName:         capStr(fullName, 120),
      contactMethod,
      contactDetail:    capStr(contactDetail, 200),
      preferredDuration: capStr(preferredDuration, 100),
      preferredDates:   capStr(preferredDates, 200),
      note:             capStr(note, 2000),
      status: 'new',
    });

    res.status(201).json({ ok: true, request: { _id: contactRequest._id } });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to submit interest.' });
  }
});

// ---------------------------------------------------------------------------
// Public — boutiques
// ---------------------------------------------------------------------------

router.get('/public/boutiques', async (_req: Request, res: Response): Promise<void> => {
  try {
    const boutiques = await BoutiqueModel.find({ active: true }).sort({ createdAt: 1 }).lean();
    const boutiquIds = boutiques.map((b) => String(b._id));
    const counts = await ProductModel.aggregate([
      { $match: { active: true, boutiqueId: { $in: boutiquIds } } },
      { $group: { _id: '$boutiqueId', count: { $sum: 1 } } },
    ]);
    const countMap: Record<string, number> = {};
    for (const c of counts) countMap[c._id as string] = c.count;

    res.status(200).json({
      boutiques: boutiques.map((b) => ({
        _id: b._id,
        name: b.name,
        tagline: b.tagline || '',
        bio: b.bio || '',
        location: b.location || '',
        coverImageUrl: b.coverImageUrl || '',
        profileImageUrl: b.profileImageUrl || '',
        logoUrl: b.logoUrl || '',
        category: b.category || '',
        section: b.section || 'earth',
        accentColor: b.accentColor || '',
        socialLinks: b.socialLinks ?? {},
        productCount: countMap[String(b._id)] ?? 0,
      })),
    });
  } catch {
    res.status(500).json({ message: 'Failed to load boutiques.' });
  }
});

router.get('/public/boutiques/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const boutique = await BoutiqueModel.findById(req.params.id).lean();
    if (!boutique || !boutique.active) {
      res.status(404).json({ message: 'Boutique not found.' });
      return;
    }
    res.status(200).json({ boutique });
  } catch {
    res.status(500).json({ message: 'Failed to load boutique.' });
  }
});

router.get('/public/boutiques/:id/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await ProductModel
      .find({ active: true, boutiqueId: req.params.id })
      .sort({ position: 1, createdAt: -1 })
      .lean();
    res.status(200).json({ products: products.map((p) => mapPublicProduct(p as never)) });
  } catch {
    res.status(500).json({ message: 'Failed to load boutique products.' });
  }
});

router.get('/public/boutiques/:id/journeys', async (req: Request, res: Response): Promise<void> => {
  try {
    const boutique = await BoutiqueModel.findById(req.params.id).select('linkedJourneyIds').lean();
    if (!boutique) { res.status(404).json({ message: 'Boutique not found.' }); return; }
    const journeyIds = boutique.linkedJourneyIds ?? [];
    if (!journeyIds.length) { res.status(200).json({ journeys: [] }); return; }
    const journeys = await JourneyModel
      .find({ _id: { $in: journeyIds }, status: { $in: ['active', 'full'] } })
      .lean();
    res.status(200).json({ journeys });
  } catch {
    res.status(500).json({ message: 'Failed to load boutique journeys.' });
  }
});

export default router;
