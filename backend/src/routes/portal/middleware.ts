import { Request, Response } from 'express';
import { Readable } from 'stream';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import { SessionModel } from '../../models/Session';
import type { ProductVariant } from '../../models/Product';
import { SiteContentModel } from '../../models/SiteContent';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed.'));
    }
  },
});

export function uploadToCloudinary(buffer: Buffer, originalname: string): Promise<string> {
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

import { logger } from '../../utils/logger';

export const BCRYPT_ROUNDS = 12;
export const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim();
const _adminPasswordRaw = (process.env.ADMIN_PASSWORD || '').trim();

if (!_adminPasswordRaw) {
  logger.warn('ADMIN_PASSWORD is not set — admin login is DISABLED until it is configured.');
}

// Hash once at startup so login comparisons are timing-safe (bcrypt prevents
// timing attacks; plain === comparison leaks password length via timing).
export const ADMIN_PASSWORD_HASH: Promise<string> = _adminPasswordRaw
  ? bcrypt.hash(_adminPasswordRaw, BCRYPT_ROUNDS)
  : Promise.resolve('');
export const SESSION_7_DAYS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_24_HOURS = 24 * 60 * 60 * 1000;

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Guards the unauthenticated public write endpoints (orders, contact requests)
// against bots flooding the admin inboxes.
export const publicWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  message: { message: 'Too many submissions. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Trim + hard-cap a free-text field so a client can't store huge payloads. */
export function capStr(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

/**
 * Honeypot check. The public forms include a hidden `website` field that real
 * users never see or fill; if it arrives populated, the submitter is a bot.
 */
export function isHoneypotTripped(req: Request): boolean {
  const hp = (req.body as { website?: unknown })?.website;
  return typeof hp === 'string' && hp.trim() !== '';
}

export function readBearerToken(req: Request): string | null {
  const authHeader = req.header('Authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export async function requireAdmin(req: Request, res: Response): Promise<boolean> {
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

export async function requireInvestor(req: Request, res: Response): Promise<string | null> {
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

export function normalizeDate(value: unknown): Date {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date value.');
  return date;
}

export function normalizeNumber(value: unknown, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number.`);
  }
  return parsed;
}

export function normalizeCurrency(value: unknown): string {
  const currency = String(value || '').trim().toUpperCase();
  const supported = ['USD', 'EUR', 'TND', 'CNY'];
  if (!supported.includes(currency)) {
    throw new Error(`Currency must be one of: ${supported.join(', ')}`);
  }
  return currency;
}

export function normalizeAvatar(value: unknown): string {
  return String(value || '').trim();
}

export function normalizeVariants(value: unknown): ProductVariant[] {
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

export function normalizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((u) => String(u || '').trim()).filter(Boolean).slice(0, 4);
}

export function normalizeSocialLinks(value: unknown): Array<{ platform: string; label: string; url: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      const l = raw as { platform?: unknown; label?: unknown; url?: unknown };
      const platform = String(l?.platform ?? '').trim().toLowerCase();
      let url = String(l?.url ?? '').trim();
      if (!platform || !url) return null;
      // Tolerate admins pasting a bare domain/handle — make it a real link.
      if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:')) url = `https://${url}`;
      return { platform, label: String(l?.label ?? '').trim(), url };
    })
    .filter((l): l is { platform: string; label: string; url: string } => l !== null)
    .slice(0, 12);
}

export const LEGACY_AVATAR_URLS: Record<string, string> = {
  popeye: '/assets/popeyesmall.png',
  olive: '/assets/olive1.jpeg',
  curto: '/assets/cortomaltese.png',
};

export const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://app.nomadme.life').replace(/\/$/, '');
export const FALLBACK_IMAGE = `${SITE_ORIGIN}/nomadme_social_card.jpg`;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Per-section showcase galleries, stored as SiteContent media lists.
const SHOP_GALLERY_KEYS = { earth: 'shop_gallery_earth', hands: 'shop_gallery_hands' } as const;

export async function loadShopGalleries(): Promise<{ earth: string[]; hands: string[] }> {
  const [earth, hands] = await Promise.all([
    SiteContentModel.findOne({ key: SHOP_GALLERY_KEYS.earth }).select('mediaUrls').lean(),
    SiteContentModel.findOne({ key: SHOP_GALLERY_KEYS.hands }).select('mediaUrls').lean(),
  ]);
  return {
    earth: (earth?.mediaUrls ?? []).filter(Boolean),
    hands: (hands?.mediaUrls ?? []).filter(Boolean),
  };
}

export function mapPublicProduct(p: Record<string, unknown> & { _id: unknown }) {
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
    section: p['section'] === 'artisanal' ? 'artisanal' : 'food',
    category: p['category'] ?? '',
  };
}
