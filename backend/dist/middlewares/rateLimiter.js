"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedLimiter = exports.globalLimiter = exports.messageLimiter = exports.postLimiter = exports.passwordResetLimiter = exports.signupLimiter = exports.loginLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const buildLimiter = (windowMin, max, message) => (0, express_rate_limit_1.default)({
    windowMs: windowMin * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message, code: 'RATE_LIMIT_EXCEEDED' },
    handler: (req, res) => {
        res.status(429).json({ message, code: 'RATE_LIMIT_EXCEEDED' });
    },
});
// Auth endpoints — strict
exports.loginLimiter = buildLimiter(15, 10, 'Too many login attempts. Try again in 15 minutes.');
exports.signupLimiter = buildLimiter(60, 10, 'Too many accounts created from this network. Try again in 1 hour.');
exports.passwordResetLimiter = buildLimiter(60, 3, 'Too many password reset requests.');
// Post creation
exports.postLimiter = buildLimiter(1, 10, 'Posting too fast. Slow down.');
// Messages
exports.messageLimiter = buildLimiter(1, 30, 'Sending too many messages.');
// General API (global fallback)
exports.globalLimiter = buildLimiter(1, 200, 'Too many requests. Please slow down.');
// Feed / read endpoints
exports.feedLimiter = buildLimiter(1, 60, 'Too many feed requests.');
