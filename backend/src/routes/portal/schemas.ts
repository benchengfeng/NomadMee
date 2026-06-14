import { z } from 'zod';

// ── Shared primitives ──────────────────────────────────────────────────────

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'TND', 'CNY'] as const;

const Currency = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim().toUpperCase() : v),
  z.enum(SUPPORTED_CURRENCIES, { error: 'Currency must be one of: USD, EUR, TND, CNY.' })
);

const NonNeg = (field: string) =>
  z.coerce.number({ error: `${field} must be a non-negative number.` }).min(0, { message: `${field} must be a non-negative number.` });

const DateStr = z
  .string()
  .refine((s) => !isNaN(Date.parse(s)), { message: 'Invalid date value.' })
  .transform((s) => new Date(s));

const OptionalDateStr = z
  .string()
  .optional()
  .transform((s) => (s ? new Date(s) : undefined));

const StringIds = z.array(z.string()).default([]).transform((arr) => arr.filter(Boolean));

const StrMediaUrls = z.array(z.string()).default([]).transform((arr) => arr.filter(Boolean));

// ── Cargo ──────────────────────────────────────────────────────────────────

export const CargoBody = z.object({
  productBeingShipped: z.string().trim().default(''),
  quantity:            NonNeg('quantity'),
  purchaseLocation:    z.string().trim().default(''),
  purchasePrice:       NonNeg('purchasePrice'),
  currency:            Currency,
  shippingDestination: z.string().trim().default(''),
  shippingPrice:       NonNeg('shippingPrice'),
  otherExpenses:       NonNeg('otherExpenses').optional().default(0),
  estimatedTimeOfArrival: DateStr,
  estimatedTimeOfSelling: DateStr,
  purchaseDate:        OptionalDateStr,
  shippingType:        z.enum(['sea', 'air', 'land']).default('sea'),
  cargoDescription:    z.string().trim().default(''),
  storyText:           z.string().trim().default(''),
  storyMediaUrls:      StrMediaUrls,
  hidden:              z.boolean().default(false),
  coverImageUrl:       z.string().trim().default(''),
});
export type CargoBody = z.infer<typeof CargoBody>;

// ── Investor ───────────────────────────────────────────────────────────────

export const InvestorBody = z.object({
  name:                           z.string().trim(),
  username:                       z.string().trim().toLowerCase(),
  password:                       z.string().optional(),
  investmentAmount:               NonNeg('investmentAmount'),
  profitPercentageOnInvestment:   NonNeg('profitPercentageOnInvestment'),
  currency:                       Currency,
  investmentIds:                  StringIds,
  location:                       z.string().trim().optional(),
});
export type InvestorBody = z.infer<typeof InvestorBody>;

// ── Investment ─────────────────────────────────────────────────────────────

export const InvestmentBody = z.object({
  title:             z.string().trim().default(''),
  description:       z.string().trim().default(''),
  currency:          Currency,
  minimumInvestment: NonNeg('minimumInvestment'),
  cargoIds:          StringIds,
  status:            z.enum(['active', 'in_progress', 'waiting', 'successful']).default('active'),
  currentStatus:     z.string().trim().default(''),
  hidden:            z.boolean().default(false),
  coverImageUrl:     z.string().trim().default(''),
  location:          z.string().trim().default(''),
});
export type InvestmentBody = z.infer<typeof InvestmentBody>;

// ── Product ────────────────────────────────────────────────────────────────

const VariantItem = z.object({
  label: z.string().trim(),
  price: z.coerce.number().min(0).default(0),
});

const PriceMatrixOptionItem = z.object({
  label:    z.string().trim(),
  price:    z.coerce.number().min(0).default(0),
  currency: z.string().trim().default('USD'),
});

const PriceMatrixRowItem = z.object({
  label:   z.string().trim(),
  options: z.array(PriceMatrixOptionItem).default([]).transform((opts) => opts.filter((o) => o.label)),
});

export const ProductBody = z.object({
  name:                 z.string().trim(),
  description:          z.string().trim().default(''),
  origin:               z.string().trim().default(''),
  originStory:          z.string().trim().default(''),
  price:                NonNeg('price'),
  currency:             Currency,
  variants:             z.array(VariantItem).default([]).transform((vs) => vs.filter((v) => v.label)),
  priceMatrix:          z.array(PriceMatrixRowItem).default([]).transform((rows) => rows.filter((r) => r.label)),
  customOrderAvailable: z.boolean().default(false),
  customOrderNote:      z.string().trim().default(''),
  stock:                z.coerce.number().min(0).default(0),
  coverImageUrl:        z.string().trim().default(''),
  images:               z.array(z.string()).default([]).transform((arr) => arr.filter(Boolean).slice(0, 4)),
  section:              z.enum(['food', 'artisanal']).default('food'),
  category:             z.string().trim().default(''),
  active:               z.boolean().default(true),
  boutiqueId:           z.string().trim().default(''),
});
export type ProductBody = z.infer<typeof ProductBody>;

// ── Site content ───────────────────────────────────────────────────────────

const SocialLinkItem = z.object({
  platform: z.string().trim().toLowerCase(),
  label:    z.string().trim().default(''),
  url:      z.string().trim().transform((u) =>
    !/^https?:\/\//i.test(u) && !u.startsWith('mailto:') ? `https://${u}` : u
  ),
}).refine((l) => l.platform && l.url);

export const SiteContentBody = z.object({
  title:     z.string().trim().default(''),
  body:      z.string().trim().default(''),
  mediaUrls: StrMediaUrls,
  links:     z.array(z.object({ platform: z.string(), label: z.string().default(''), url: z.string() }))
               .default([])
               .transform((arr) =>
                 arr
                   .map((l) => {
                     const platform = l.platform.trim().toLowerCase();
                     let url = l.url.trim();
                     if (!platform || !url) return null;
                     if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:')) url = `https://${url}`;
                     return { platform, label: l.label.trim(), url };
                   })
                   .filter((l): l is { platform: string; label: string; url: string } => l !== null)
                   .slice(0, 12)
               ),
});
export type SiteContentBody = z.infer<typeof SiteContentBody>;

// ── Partner ────────────────────────────────────────────────────────────────

export const PartnerBody = z.object({
  name:        z.string().trim(),
  logoUrl:     z.string().trim().default(''),
  title:       z.string().trim().default(''),
  description: z.string().trim().default(''),
  active:      z.boolean().default(true),
  location:    z.string().trim().default(''),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
});
export type PartnerBody = z.infer<typeof PartnerBody>;

// ── Boutique ───────────────────────────────────────────────────────────────

const BoutiqueSocialLinksItem = z.object({
  instagram: z.string().trim().default(''),
  website:   z.string().trim().default(''),
});

export const BoutiqueBody = z.object({
  name:             z.string().trim(),
  tagline:          z.string().trim().default(''),
  bio:              z.string().trim().default(''),
  originStory:      z.string().trim().default(''),
  location:         z.string().trim().default(''),
  locationLat:      z.coerce.number().optional(),
  locationLng:      z.coerce.number().optional(),
  coverImageUrl:    z.string().trim().default(''),
  profileImageUrl:  z.string().trim().default(''),
  logoUrl:          z.string().trim().default(''),
  galleryUrls:      z.array(z.string()).default([]).transform((a) => a.filter(Boolean)),
  category:         z.string().trim().default(''),
  section:          z.enum(['earth', 'hands']).default('earth'),
  accentColor:      z.string().trim().default(''),
  active:           z.boolean().default(true),
  linkedJourneyIds: z.array(z.string()).default([]).transform((a) => a.filter(Boolean)),
  socialLinks:      BoutiqueSocialLinksItem.default({ instagram: '', website: '' }),
});
export type BoutiqueBody = z.infer<typeof BoutiqueBody>;

// ── Bundle ─────────────────────────────────────────────────────────────────

export const BundleBody = z.object({
  name:        z.string().trim(),
  imageUrl:    z.string().trim().default(''),
  description: z.string().trim().default(''),
  price:       NonNeg('price'),
  currency:    Currency,
  productIds:  StringIds,
  section:     z.enum(['food', 'artisanal']).default('food'),
  active:      z.boolean().default(true),
});
export type BundleBody = z.infer<typeof BundleBody>;

// ── Journey ────────────────────────────────────────────────────────────────

const DurationOptionItem = z.object({
  label:       z.string().trim(),
  price:       z.coerce.number().min(0).default(0),
  currency:    z.string().trim().default('USD'),
  description: z.string().trim().default(''),
});

export const JourneyBody = z.object({
  title:          z.string().trim(),
  tagline:        z.string().trim().default(''),
  story:          z.string().trim().default(''),
  location:       z.string().trim().default(''),
  locationLat:    z.coerce.number().default(0),
  locationLng:    z.coerce.number().default(0),
  coverImageUrl:  z.string().trim().default(''),
  coverVideoUrl:  z.string().trim().default(''),
  gallery:        z.array(z.string()).default([]).transform((a) => a.filter(Boolean)),
  durations:      z.array(DurationOptionItem).default([]).transform((a) => a.filter((d) => d.label)),
  included:       z.array(z.string()).default([]).transform((a) => a.filter(Boolean)),
  notIncluded:    z.array(z.string()).default([]).transform((a) => a.filter(Boolean)),
  maxGroupSize:   z.coerce.number().min(1).default(6),
  spotsRemaining: z.coerce.number().min(0).default(6),
  guideName:      z.string().trim().default(''),
  guidePhoto:     z.string().trim().default(''),
  guideBio:       z.string().trim().default(''),
  guideQuote:     z.string().trim().default(''),
  availableDates: z.array(z.string()).default([]).transform((a) => a.filter(Boolean)),
  status:         z.enum(['draft', 'active', 'full', 'past']).default('draft'),
});
export type JourneyBody = z.infer<typeof JourneyBody>;

// ── Journey interest ────────────────────────────────────────────────────────

export const JourneyInterestBody = z.object({
  journeyId:        z.string().trim(),
  journeyTitle:     z.string().trim().default(''),
  fullName:         z.string().trim(),
  contactMethod:    z.enum(['whatsapp', 'email']),
  contactDetail:    z.string().trim(),
  preferredDuration: z.string().trim().default(''),
  preferredDates:   z.string().trim().default(''),
  note:             z.string().trim().default(''),
  website:          z.string().optional(), // honeypot
});
export type JourneyInterestBody = z.infer<typeof JourneyInterestBody>;

// ── Error helper ───────────────────────────────────────────────────────────

export function zodErr(err: unknown, fallback: string): string {
  if (err instanceof z.ZodError) {
    const first = err.issues[0];
    if (!first) return fallback;
    const path = first.path.join('.');
    return path ? `${path}: ${first.message}` : first.message;
  }
  return err instanceof Error ? err.message : fallback;
}
