import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

// Standup conversation endpoints
router.post('/message', chatController.sendMessage);
router.get('/session', chatController.getSession);
router.post('/session/reset', chatController.resetSession);

export default router;
