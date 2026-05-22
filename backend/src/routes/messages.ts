import { Router } from 'express';
import { getMessages, sendMessage, deleteMessage, deleteConversation, getConversations, reactToMessage } from '../controllers/messages';
import { authenticate } from '../middlewares/auth';
import { messageLimiter } from '../middlewares/rateLimiter';
import { sanitizeBody } from '../middlewares/security';
import { moderateMessageContent } from '../middlewares/moderation';

const router = Router();

router.get('/conversations', authenticate, getConversations);
router.get('/:userId', authenticate, getMessages);
router.post('/:userId', messageLimiter, authenticate, sanitizeBody, moderateMessageContent, sendMessage);
router.delete('/:messageId', authenticate, deleteMessage);
router.delete('/chat/:conversationId', authenticate, deleteConversation);
router.post('/:messageId/react', authenticate, reactToMessage);

export default router;
