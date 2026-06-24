import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/stats', dashboardController.getStats);
router.get('/charts', dashboardController.getCharts);

export default router;
