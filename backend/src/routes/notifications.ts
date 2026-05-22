import { Router } from 'express';
import { listNotifications, markAllRead } from '../controllers/notifications';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, listNotifications);
router.post('/mark-all-read', authenticate, markAllRead);

export default router;
