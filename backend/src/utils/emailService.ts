import { Resend } from 'resend';
import { logger } from './logger';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'NomadMee <noreply@nomadmee.com>';
const APP_URL = process.env.APP_URL || 'https://nomadmee.com';

const html = (body: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; padding: 0; background: #0a0c14; font-family: 'Inter', sans-serif; color: #e2e8f0; }
  .wrap { max-width: 560px; margin: 40px auto; background: #111827; border-radius: 16px; overflow: hidden; border: 1px solid rgba(200,160,106,0.15); }
  .header { padding: 32px 40px 24px; border-bottom: 1px solid rgba(200,160,106,0.1); }
  .brand { font-size: 1.1rem; font-weight: 700; color: #c8a06a; letter-spacing: 0.05em; text-transform: uppercase; }
  .body { padding: 32px 40px; }
  h2 { font-size: 1.4rem; font-weight: 700; color: #f1f5f9; margin: 0 0 16px; }
  p { font-size: 0.95rem; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
  .btn { display: inline-block; margin: 8px 0 24px; padding: 14px 28px; background: linear-gradient(135deg,#c8a06a,#a07840); color: #0a0c14; font-weight: 700; font-size: 0.95rem; text-decoration: none; border-radius: 10px; }
  .note { font-size: 0.78rem; color: #475569; }
  .footer { padding: 20px 40px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.75rem; color: #334155; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><span class="brand">NomadMee</span></div>
  <div class="body">${body}</div>
  <div class="footer">© ${new Date().getFullYear()} NomadMee · You received this because you signed up at nomadmee.com</div>
</div>
</body>
</html>`;

async function send(to: string, subject: string, body: string) {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY not set — email not sent', { to, subject });
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html: html(body) });
  } catch (err) {
    logger.error('Email send failed', { to, subject, error: String(err) });
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  await send(to, 'Verify your NomadMee account', `
    <h2>Verify your email</h2>
    <p>Thanks for joining NomadMee. Click the button below to verify your email address and activate your account.</p>
    <a href="${url}" class="btn">Verify Email</a>
    <p class="note">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
  `);
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await send(to, 'Reset your NomadMee password', `
    <h2>Reset your password</h2>
    <p>We received a request to reset the password for your NomadMee account. Click the button below to choose a new password.</p>
    <a href="${url}" class="btn">Reset Password</a>
    <p class="note">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
  `);
}

export async function sendWelcomeEmail(to: string, name: string) {
  await send(to, 'Welcome to NomadMee', `
    <h2>Welcome, ${name}!</h2>
    <p>Your account is now active. You can sign in to explore the NomadMee member lounge — and when investment opportunities open up, you'll be among the first to know.</p>
    <a href="${APP_URL}/login" class="btn">Go to your account</a>
    <p class="note">Need help? Reply to this email and we'll be happy to assist.</p>
  `);
}

export async function sendGoogleLinkedEmail(to: string) {
  await send(to, 'Google account linked to NomadMee', `
    <h2>Google account linked</h2>
    <p>Your Google account has been successfully linked to your NomadMee account. You can now sign in with Google.</p>
    <p class="note">If you didn't do this, please contact us immediately by replying to this email.</p>
  `);
}
