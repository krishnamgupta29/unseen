import { Router } from 'express';
import { getStats, getFlaggedPosts, removePost, clearPost, suspendUser, unsuspendUser, getAbuseLogs, resolveAbuseLog, getUsers } from '../controllers/admin';
import { authenticate, requireAdmin } from '../middlewares/auth';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

router.get('/stats', getStats);
router.get('/flagged-posts', getFlaggedPosts);
router.post('/posts/:id/remove', removePost);
router.post('/posts/:id/clear', clearPost);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/unsuspend', unsuspendUser);
router.get('/abuse-logs', getAbuseLogs);
router.post('/abuse-logs/:id/resolve', resolveAbuseLog);
router.get('/users', getUsers);

export default router;
