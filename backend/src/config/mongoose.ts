import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const DEFAULT_MONGO_URL = 'mongodb://127.0.0.1:27017/nomadme';

export async function connectMongo(): Promise<void> {
  const mongoUrl = (process.env.MONGO_URL || DEFAULT_MONGO_URL).trim();

  if (!mongoUrl) {
    throw new Error('MONGO_URL is required.');
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUrl);

  logger.info('MongoDB connected', { url: mongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@') });
}
