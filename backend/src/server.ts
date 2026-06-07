import 'dotenv/config';
import express from 'express';
import { logger } from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import sendEmailRoutes from './routes/sendEmail';
import statusRoutes from './routes/status';
import portalRoutes from './routes/portal';
import { connectMongo } from './config/mongoose';

const app = express();

// We sit behind one reverse proxy (nginx) in production — trust the first hop
// so express-rate-limit and req.ip see the real client address, not the proxy's.
app.set('trust proxy', 1);

// Security headers (HSTS, no-sniff, frameguard, etc.). This is a JSON API, so
// the CSP defaults don't affect the separately-served frontend.
app.use(helmet());

// CORS — restricted to our own origins in production. Set ALLOWED_ORIGINS in the
// backend .env as a comma-separated list (e.g. "https://nomadme.life,https://app.nomadme.life").
// If unset, falls back to reflecting the request origin so local dev keeps working.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Middleware for parsing requests
app.use(bodyParser.json());

// Routes
app.use('/api/sendEmail', sendEmailRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/portal', portalRoutes);

async function startServer(): Promise<void> {
  await connectMongo();

  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    logger.info('Server started', { port });
  });
}

void startServer().catch((error) => {
  logger.error('Failed to start server', { error: String(error) });
  process.exit(1);
});
