import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import passport from '../../config/passport';
import { InvestorModel } from '../../models/Investor';
import { SessionModel } from '../../models/Session';
import { BCRYPT_ROUNDS, SESSION_7_DAYS, readBearerToken, requireInvestor } from '../portal/middleware';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendGoogleLinkedEmail,
} from '../../utils/emailService';
import { logger } from '../../utils/logger';

const router = Router();

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: 'Too many registration attempts. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: 'Too many password reset requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------------------------------------------------------------------------
// Email / password registration
// ---------------------------------------------------------------------------

router.post('/register', registerLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters.' });
      return;
    }

    const normalized = email.trim().toLowerCase();
    const existing = await InvestorModel.findOne({ email: normalized }).lean();
    if (existing) {
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }

    const trimmedName = name.trim().slice(0, 80);
    const baseUsername = normalized.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'user';
    const suffix = crypto.randomBytes(3).toString('hex');
    const username = `${baseUsername}_${suffix}`;

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    await InvestorModel.create({
      name: trimmedName,
      displayName: trimmedName,
      username,
      password: hashedPassword,
      email: normalized,
      emailVerified: false,
      registrationMethod: 'email',
      accountStatus: 'pending_verification',
      passwordResetToken: verifyToken,
      passwordResetExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      kycCompleted: false,
      assignedCargoIds: [],
      assignedInvestmentIds: [],
    });

    await sendVerificationEmail(normalized, verifyToken);

    res.status(201).json({ message: 'Account created. Please check your email to verify your address.' });
  } catch (err) {
    logger.error('Registration error', { error: String(err) });
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ message: 'Verification token is required.' });
    return;
  }

  const investor = await InvestorModel.findOne({
    passwordResetToken: token,
    passwordResetExpiry: { $gt: new Date() },
    emailVerified: false,
  });

  if (!investor) {
    res.status(400).json({ message: 'Verification link is invalid or has expired.' });
    return;
  }

  investor.emailVerified = true;
  investor.accountStatus = 'active';
  investor.passwordResetToken = undefined;
  investor.passwordResetExpiry = undefined;
  await investor.save();

  const sessionToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_7_DAYS);
  await SessionModel.create({ token: sessionToken, userId: String(investor._id), role: 'investor', expiresAt });

  if (investor.email) {
    await sendWelcomeEmail(investor.email, investor.name);
  }

  res.status(200).json({ message: 'Email verified. Welcome to NomadMee!', token: sessionToken });
});

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------

router.post('/forgot-password', resetLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ message: 'Email address is required.' });
    return;
  }

  const normalized = email.trim().toLowerCase();
  const investor = await InvestorModel.findOne({ email: normalized, accountStatus: { $ne: 'suspended' } });

  // Always respond success to prevent email enumeration
  if (!investor) {
    res.status(200).json({ message: 'If that email is registered, you will receive a reset link.' });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  investor.passwordResetToken = resetToken;
  investor.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await investor.save();

  await sendPasswordResetEmail(normalized, resetToken);
  res.status(200).json({ message: 'If that email is registered, you will receive a reset link.' });
});

// ---------------------------------------------------------------------------
// Reset password
// ---------------------------------------------------------------------------

router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) {
    res.status(400).json({ message: 'Token and new password are required.' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ message: 'Password must be at least 8 characters.' });
    return;
  }

  const investor = await InvestorModel.findOne({
    passwordResetToken: token,
    passwordResetExpiry: { $gt: new Date() },
  });

  if (!investor) {
    res.status(400).json({ message: 'Reset link is invalid or has expired.' });
    return;
  }

  investor.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
  investor.passwordResetToken = undefined;
  investor.passwordResetExpiry = undefined;
  if (investor.accountStatus === 'pending_verification') {
    investor.accountStatus = 'active';
    investor.emailVerified = true;
  }
  await investor.save();

  res.status(200).json({ message: 'Password updated successfully. You can now sign in.' });
});

// ---------------------------------------------------------------------------
// Google OAuth — sign in / sign up
// ---------------------------------------------------------------------------

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_failed' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as { _id: string; isLink: boolean } | undefined;
      if (!user) {
        res.redirect('/login?error=google_failed');
        return;
      }

      const APP_URL = process.env.APP_URL || 'http://localhost:3000';

      if (user.isLink) {
        const investor = await InvestorModel.findById(user._id).lean();
        if (investor?.email) await sendGoogleLinkedEmail(investor.email);
        res.redirect(`${APP_URL}/home?google_linked=1`);
        return;
      }

      const sessionToken = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + SESSION_7_DAYS);
      await SessionModel.create({ token: sessionToken, userId: user._id, role: 'investor', expiresAt });

      res.redirect(`${APP_URL}/auth/callback?token=${sessionToken}`);
    } catch (err) {
      logger.error('Google callback error', { error: String(err) });
      res.redirect('/login?error=google_failed');
    }
  }
);

// ---------------------------------------------------------------------------
// Google account linking (requires existing session)
// ---------------------------------------------------------------------------

router.get('/google/link', async (req: Request, res: Response): Promise<void> => {
  const investorId = await requireInvestor(req, res);
  if (!investorId) return;

  // Stash the user ID in the request so passport's callback can find it
  (req as Request & { linkUserId?: string }).linkUserId = investorId;
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: `link:${investorId}`,
  })(req, res, () => { /* no-op */ });
});

router.delete('/google/link', async (req: Request, res: Response): Promise<void> => {
  const investorId = await requireInvestor(req, res);
  if (!investorId) return;

  const investor = await InvestorModel.findById(investorId);
  if (!investor) {
    res.status(404).json({ message: 'Investor not found.' });
    return;
  }
  if (!investor.password) {
    res.status(400).json({ message: 'Set a password before unlinking Google so you can still sign in.' });
    return;
  }

  investor.googleId = undefined;
  await investor.save();
  res.status(200).json({ message: 'Google account unlinked.' });
});

// ---------------------------------------------------------------------------
// Resend verification email
// ---------------------------------------------------------------------------

router.post('/resend-verification', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ message: 'Email is required.' });
    return;
  }
  const normalized = email.trim().toLowerCase();
  const investor = await InvestorModel.findOne({ email: normalized, emailVerified: false });
  if (!investor) {
    res.status(200).json({ message: 'If that email exists and is unverified, a new link has been sent.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  investor.passwordResetToken = token;
  investor.passwordResetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await investor.save();
  await sendVerificationEmail(normalized, token);
  res.status(200).json({ message: 'If that email exists and is unverified, a new link has been sent.' });
});

export default router;
