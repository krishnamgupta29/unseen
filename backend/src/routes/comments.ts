import { Router } from 'express';
import { getComments, createComment, toggleLikeComment } from '../controllers/comments';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { sanitizeBody } from '../middlewares/security';

const router = Router();

router.get('/:postId', optionalAuth, getComments);
router.post('/:postId', authenticate, sanitizeBody, createComment);
router.post('/:commentId/like', authenticate, toggleLikeComment);

export default router;
