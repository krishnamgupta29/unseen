import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

// Throttle lastSeenAt writes: only update once per 60 seconds per user
const lastSeenThrottle = new Map<string, number>();
const LAST_SEEN_INTERVAL_MS = 60000; // 60 seconds

function throttledLastSeenUpdate(userId: string) {
  const now = Date.now();
  const lastUpdated = lastSeenThrottle.get(userId) || 0;
  if (now - lastUpdated > LAST_SEEN_INTERVAL_MS) {
    lastSeenThrottle.set(userId, now);
    User.findByIdAndUpdate(userId, { lastSeenAt: new Date() }).catch(() => {});
  }
}

/**
 * Verify JWT Access Token from Authorization header or HTTP-only cookie
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Try cookie first (more secure), then Authorization header (for mobile clients)
  const tokenFromCookie = req.cookies?.accessToken;
  const tokenFromHeader = req.header('Authorization')?.split(' ')[1];
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string;
      username: string;
      role: string;
      sessionId?: string;
    };

    // Verify active session on every protected request
    const user = await User.findById(decoded.id).select('currentSessionId isSuspended isActive').lean();
    if (!user || !user.isActive || user.isSuspended) {
      return res.status(401).json({ message: 'Account not accessible.' });
    }

    if (!decoded.sessionId || decoded.sessionId !== user.currentSessionId) {
      return res.status(401).json({
        message: 'Your account has been logged in on another device. This session has been ended for security reasons.',
        code: 'SESSION_TERMINATED'
      });
    }

    req.user = decoded;
    // Update lastSeenAt throttled (max once per 60s per user)
    throttledLastSeenUpdate(decoded.id);
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

/**
 * Admin-only route guard
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};

/**
 * Moderator or Admin route guard
 */
export const requireModerator = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Moderator access required.' });
  }
  next();
};

/**
 * Optional auth — attach user if token present, continue regardless
 */
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const tokenFromCookie = req.cookies?.accessToken;
  const tokenFromHeader = req.header('Authorization')?.split(' ')[1];
  const token = tokenFromCookie || tokenFromHeader;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        id: string;
        username: string;
        role: string;
        sessionId?: string;
      };
      
      const user = await User.findById(decoded.id).select('currentSessionId isSuspended isActive').lean();
      if (user && user.isActive && !user.isSuspended && decoded.sessionId === user.currentSessionId) {
        req.user = decoded;
        // Update lastSeenAt throttled (max once per 60s per user)
        throttledLastSeenUpdate(decoded.id);
      }
    } catch {
      // Token invalid — continue as guest
    }
  }
  next();
};

