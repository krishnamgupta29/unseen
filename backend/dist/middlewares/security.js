"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.additionalSecurityHeaders = exports.mongoSanitize = exports.sanitizeBody = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validates express-validator results and returns 400 on failure
 */
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};
exports.validateRequest = validateRequest;
/**
 * XSS protection — strip dangerous HTML from string fields
 */
function sanitizeString(val) {
    return val
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/`/g, '&#x60;');
}
function sanitizeObject(obj) {
    if (typeof obj === 'string')
        return sanitizeString(obj);
    if (Array.isArray(obj))
        return obj.map(sanitizeObject);
    if (obj && typeof obj === 'object') {
        const cleaned = {};
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
const sanitizeBody = (req, _res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
};
exports.sanitizeBody = sanitizeBody;
/**
 * Middleware: MongoDB injection protection
 * Strips keys starting with $ or containing .
 */
const mongoSanitize = (req, _res, next) => {
    const stripDollar = (obj) => {
        if (obj && typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
                if (key.startsWith('$') || key.includes('.')) {
                    delete obj[key];
                }
                else {
                    obj[key] = stripDollar(obj[key]);
                }
            }
        }
        return obj;
    };
    if (req.body)
        stripDollar(req.body);
    if (req.query)
        stripDollar(req.query);
    next();
};
exports.mongoSanitize = mongoSanitize;
/**
 * Security headers beyond Helmet defaults
 */
const additionalSecurityHeaders = (_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
};
exports.additionalSecurityHeaders = additionalSecurityHeaders;
