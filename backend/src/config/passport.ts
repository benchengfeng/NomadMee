import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { InvestorModel } from '../models/Investor';
import { logger } from '../utils/logger';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const API_URL = process.env.API_URL || 'http://localhost:8000';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  logger.warn('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google OAuth is disabled.');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${API_URL}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, _accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(new Error('Google account has no email address.'));

        const linkUserId = (req as { linkUserId?: string }).linkUserId;

        // Account linking flow: user is already logged in and wants to link Google
        if (linkUserId) {
          const existing = await InvestorModel.findOne({ googleId: profile.id }).lean();
          if (existing && String(existing._id) !== linkUserId) {
            return done(new Error('This Google account is already linked to another user.'));
          }
          const updated = await InvestorModel.findByIdAndUpdate(
            linkUserId,
            { googleId: profile.id, emailVerified: true },
            { new: true }
          ).lean();
          if (!updated) return done(new Error('User not found.'));
          return done(null, { _id: String(updated._id), isLink: true });
        }

        // Sign-in / sign-up flow
        let investor = await InvestorModel.findOne({ googleId: profile.id }).lean();
        if (investor) {
          if (investor.accountStatus === 'suspended') {
            return done(new Error('Account suspended. Please contact support.'));
          }
          return done(null, { _id: String(investor._id), isLink: false });
        }

        // Check if email already registered without Google
        const byEmail = await InvestorModel.findOne({ email }).lean();
        if (byEmail) {
          // Link Google to existing email account
          await InvestorModel.updateOne({ _id: byEmail._id }, { googleId: profile.id, emailVerified: true });
          return done(null, { _id: String(byEmail._id), isLink: false });
        }

        // New user via Google
        const displayName = profile.displayName || email.split('@')[0];
        const username = `g_${profile.id.slice(0, 12)}`;
        investor = await InvestorModel.create({
          name: displayName,
          displayName,
          username,
          email,
          emailVerified: true,
          googleId: profile.id,
          registrationMethod: 'google',
          accountStatus: 'active',
          kycCompleted: false,
          assignedCargoIds: [],
          assignedInvestmentIds: [],
        });

        return done(null, { _id: String(investor._id), isLink: false });
      } catch (err) {
        logger.error('Google OAuth error', { error: String(err) });
        return done(err as Error);
      }
    }
  )
);

export default passport;
