import { Request, Response, NextFunction } from 'express';
import { moderateContent } from '../services/moderationAI';
import { AuthRequest } from './auth';

/**
 * Middleware: Analyze post content before saving
 * Blocks high-toxicity content, flags medium-toxicity for review
 */
export const moderatePostContent = (req: AuthRequest, res: Response, next: NextFunction) => {
  const content: string = req.body?.content || '';

  if (!content.trim()) {
    return res.status(400).json({ message: 'Content cannot be empty.' });
  }

  const result = moderateContent(content);

  if (result.isBlocked) {
    return res.status(400).json({
      message: 'Your post violates community guidelines and cannot be published.',
      categories: result.categories,
    });
  }

  // Attach moderation data to request for controller to store
  (req as any).moderationResult = result;
  next();
};

/**
 * Middleware: Analyze message content before storing
 */
export const moderateMessageContent = (req: AuthRequest, res: Response, next: NextFunction) => {
  const content: string = req.body?.content || '';

  if (!content.trim()) {
    return res.status(400).json({ message: 'Message cannot be empty.' });
  }

  const result = moderateContent(content);

  if (result.isBlocked) {
    return res.status(400).json({
      message: 'This message cannot be sent as it violates our guidelines.',
    });
  }

  (req as any).moderationResult = result;
  next();
};
