import { Router } from 'express';
import { timesheetController } from '../controllers/timesheet.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/', timesheetController.createEntry);
router.get('/', timesheetController.getEntries);
router.get('/monthly', timesheetController.getMonthlyEntries);
router.put('/:id', timesheetController.updateEntry);
router.delete('/:id', timesheetController.deleteEntry);

export default router;
