import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

const MONGO_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

router.get('/', (_req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;
  const mongoOk = mongoState === 1;
  const status = mongoOk ? 'ok' : 'degraded';

  res.status(mongoOk ? 200 : 503).json({
    status,
    uptime: Math.floor(process.uptime()),
    mongo: MONGO_STATES[mongoState] ?? `state:${mongoState}`,
    ts: new Date().toISOString(),
  });
});

export default router;
