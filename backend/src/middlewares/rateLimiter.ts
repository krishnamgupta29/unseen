import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const buildLimiter = (windowMin: number, max: number, message: string) =>
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message, code: 'RATE_LIMIT_EXCEEDED' },
    handler: (req: Request, res: Response) => {
      res.status(429).json({ message, code: 'RATE_LIMIT_EXCEEDED' });
    },
  });

// Auth endpoints — strict
export const loginLimiter = buildLimiter(15, 10, 'Too many login attempts. Try again in 15 minutes.');
export const signupLimiter = buildLimiter(60, 10, 'Too many accounts created from this network. Try again in 1 hour.');
export const passwordResetLimiter = buildLimiter(60, 3, 'Too many password reset requests.');

// Post creation
export const postLimiter = buildLimiter(1, 10, 'Posting too fast. Slow down.');

// Messages
export const messageLimiter = buildLimiter(1, 30, 'Sending too many messages.');

// General API (global fallback)
export const globalLimiter = buildLimiter(1, 200, 'Too many requests. Please slow down.');

// Feed / read endpoints
export const feedLimiter = buildLimiter(1, 60, 'Too many feed requests.');
