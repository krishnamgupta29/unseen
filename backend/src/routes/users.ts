import { Router } from 'express';
import { getUserProfile, getUserPosts, toggleFollow, getFollowers, getFollowing, searchUsers, updateProfile, getSavedPosts, reportUser, deleteAccount } from '../controllers/users';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { sanitizeBody } from '../middlewares/security';

const router = Router();

router.get('/search', authenticate, searchUsers);
router.put('/profile', authenticate, sanitizeBody, updateProfile);
router.delete('/profile', authenticate, deleteAccount);
router.get('/:id', optionalAuth, getUserProfile);
router.get('/:id/posts', optionalAuth, getUserPosts);
router.get('/:id/saved', authenticate, getSavedPosts);
router.get('/:id/followers', optionalAuth, getFollowers);
router.get('/:id/following', optionalAuth, getFollowing);
router.post('/:id/follow', authenticate, sanitizeBody, toggleFollow);
router.post('/:id/report', authenticate, sanitizeBody, reportUser);

export default router;
