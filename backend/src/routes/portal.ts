import { Router } from 'express';
import publicRouter from './portal/public';
import adminRouter from './portal/admin';
import investorRouter from './portal/investor';

// cloudinary.config and all shared utilities are initialised in ./portal/middleware.ts
// at module-load time (imported transitively by the three sub-routers above).

const router = Router();
router.use(publicRouter);
router.use(adminRouter);
router.use(investorRouter);

export default router;
