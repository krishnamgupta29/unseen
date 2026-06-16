import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Validates express-validator results and returns 400 on failure
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: (e as any).path, message: e.msg })),
    });
  }
  next();
};

/**
 * XSS protection — strip dangerous HTML tags from string fields.
 * Only encode < and > which are the actual XSS vectors.
 * Do NOT encode apostrophes (') or slashes (/) as React renders
 * content as plain text nodes (not innerHTML), so these would
 * appear as literal &#x27; / &#x2F; text instead of ' and /.
 */
function sanitizeString(val: string): string {
  return val
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = sanitizeObject(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

/**
 * Middleware: sanitize all request body fields
 */
export const sanitizeBody = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware: MongoDB injection protection
 * Strips keys starting with $ or containing .
 */
export const mongoSanitize = (req: Request, _res: Response, next: NextFunction) => {
  const stripDollar = (obj: any): any => {
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else {
          obj[key] = stripDollar(obj[key]);
        }
      }
    }
    return obj;
  };
  if (req.body) stripDollar(req.body);
  if (req.query) stripDollar(req.query);
  next();
};

/**
 * Security headers beyond Helmet defaults
 */
export const additionalSecurityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};
