"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireModerator = exports.requireAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
/**
 * Verify JWT Access Token from Authorization header or HTTP-only cookie
 */
const authenticate = (req, res, next) => {
    // Try cookie first (more secure), then Authorization header (for mobile clients)
    const tokenFromCookie = req.cookies?.accessToken;
    const tokenFromHeader = req.header('Authorization')?.split(' ')[1];
    const token = tokenFromCookie || tokenFromHeader;
    if (!token) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        // Update lastSeenAt asynchronously to keep requests fast
        User_1.default.findByIdAndUpdate(decoded.id, { lastSeenAt: new Date() }).catch(() => { });
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
const optionalAuth = (req, _res, next) => {
    const tokenFromCookie = req.cookies?.accessToken;
    const tokenFromHeader = req.header('Authorization')?.split(' ')[1];
    const token = tokenFromCookie || tokenFromHeader;
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded;
            // Update lastSeenAt asynchronously
            User_1.default.findByIdAndUpdate(decoded.id, { lastSeenAt: new Date() }).catch(() => { });
        }
        catch {
            // Token invalid — continue as guest
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
