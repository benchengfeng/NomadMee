import { Router, Request, Response } from 'express';

const router = Router();

// Simple GET route to test service availability
router.get('/', (req: Request, res: Response) => {
  try {
    res.status(200).json({ message: 'Service is up and running' });
  } catch (error:any) {
    res.status(500).json({ message: 'Service is unavailable', error: error.message });
  }
});

export default router;
