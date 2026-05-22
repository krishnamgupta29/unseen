import { Router } from 'express';
import { getFeed, recordInteraction, getTrendingTags, createPost, getNetworkStats, getPostById, deletePost } from '../controllers/feed';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { feedLimiter, postLimiter } from '../middlewares/rateLimiter';
import { sanitizeBody } from '../middlewares/security';
import { moderatePostContent } from '../middlewares/moderation';

const router = Router();

router.get('/', feedLimiter, optionalAuth, getFeed);
router.get('/stats', feedLimiter, getNetworkStats);
router.get('/trending-tags', feedLimiter, getTrendingTags);
router.get('/posts/:id', optionalAuth, getPostById);
router.post('/posts', postLimiter, authenticate, sanitizeBody, moderatePostContent, createPost);
router.post('/interact', authenticate, sanitizeBody, recordInteraction);
router.delete('/posts/:id', authenticate, deletePost);

export default router;
