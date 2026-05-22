import { Router } from 'express';
import { createPost, getPosts } from '../controllers/posts';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getPosts);
router.post('/', authenticate, createPost);

export default router;
