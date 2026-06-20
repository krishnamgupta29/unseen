"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireModerator = exports.requireAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
// Throttle lastSeenAt writes: only update once per 60 seconds per user
const lastSeenThrottle = new Map();
const LAST_SEEN_INTERVAL_MS = 60000; // 60 seconds
function throttledLastSeenUpdate(userId) {
    const now = Date.now();
    const lastUpdated = lastSeenThrottle.get(userId) || 0;
    if (now - lastUpdated > LAST_SEEN_INTERVAL_MS) {
        lastSeenThrottle.set(userId, now);
        User_1.default.findByIdAndUpdate(userId, { lastSeenAt: new Date() }).catch(() => { });
    }
}
/**
 * Verify JWT Access Token from Authorization header or HTTP-only cookie
 */
const authenticate = async (req, res, next) => {
    // Try cookie first (more secure), then Authorization header (for mobile clients)
    const tokenFromCookie = req.cookies?.accessToken;
    const tokenFromHeader = req.header('Authorization')?.split(' ')[1];
    const token = tokenFromCookie || tokenFromHeader;
    if (!token) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        // Verify active session on every protected request
        const user = await User_1.default.findById(decoded.id).select('currentSessionId isSuspended isActive').lean();
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
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ message: 'Invalid token.' });
    }
};
exports.authenticate = authenticate;
/**
 * Admin-only route guard
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required.' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * Moderator or Admin route guard
 */
const requireModerator = (req, res, next) => {
    if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Moderator access required.' });
    }
    next();
};
exports.requireModerator = requireModerator;
/**
 * Optional auth — attach user if token present, continue regardless
 */
const optionalAuth = async (req, _res, next) => {
    const tokenFromCookie = req.cookies?.accessToken;
    const tokenFromHeader = req.header('Authorization')?.split(' ')[1];
    const token = tokenFromCookie || tokenFromHeader;
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            const user = await User_1.default.findById(decoded.id).select('currentSessionId isSuspended isActive').lean();
            if (user && user.isActive && !user.isSuspended && decoded.sessionId === user.currentSessionId) {
                req.user = decoded;
                // Update lastSeenAt throttled (max once per 60s per user)
                throttledLastSeenUpdate(decoded.id);
            }
        }
        catch {
            // Token invalid — continue as guest
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
