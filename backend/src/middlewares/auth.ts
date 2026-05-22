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

/**
 * Verify JWT Access Token from Authorization header or HTTP-only cookie
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
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
    };
    req.user = decoded;
    // Update lastSeenAt asynchronously to keep requests fast
    User.findByIdAndUpdate(decoded.id, { lastSeenAt: new Date() }).catch(() => {});
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
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const tokenFromCookie = req.cookies?.accessToken;
  const tokenFromHeader = req.header('Authorization')?.split(' ')[1];
  const token = tokenFromCookie || tokenFromHeader;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        id: string;
        username: string;
        role: string;
      };
      req.user = decoded;
      // Update lastSeenAt asynchronously
      User.findByIdAndUpdate(decoded.id, { lastSeenAt: new Date() }).catch(() => {});
    } catch {
      // Token invalid — continue as guest
    }
  }
  next();
};
