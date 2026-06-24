import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/session', chatController.createSession);
router.post('/message', chatController.sendMessage);
router.get('/sessions', chatController.getSessions);
router.get('/:sessionId/history', chatController.getHistory);
router.delete('/:sessionId', chatController.deleteSession);

export default router;
