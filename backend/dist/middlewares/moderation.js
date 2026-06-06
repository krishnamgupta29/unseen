"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateMessageContent = exports.moderatePostContent = void 0;
const moderationAI_1 = require("../services/moderationAI");
/**
 * Middleware: Analyze post content before saving
 * Blocks high-toxicity content, flags medium-toxicity for review
 */
const moderatePostContent = (req, res, next) => {
    const content = req.body?.content || '';
    if (!content.trim()) {
        return res.status(400).json({ message: 'Content cannot be empty.' });
    }
    const result = (0, moderationAI_1.moderateContent)(content);
    if (result.isBlocked) {
        return res.status(400).json({
            message: 'Your post violates community guidelines and cannot be published.',
            categories: result.categories,
        });
    }
    // Attach moderation data to request for controller to store
    req.moderationResult = result;
    next();
};
exports.moderatePostContent = moderatePostContent;
/**
 * Middleware: Analyze message content before storing
 */
const moderateMessageContent = (req, res, next) => {
    const content = req.body?.content || '';
    if (!content.trim()) {
        return res.status(400).json({ message: 'Message cannot be empty.' });
    }
    const result = (0, moderationAI_1.moderateContent)(content);
    if (result.isBlocked) {
        return res.status(400).json({
            message: 'This message cannot be sent as it violates our guidelines.',
        });
    }
    req.moderationResult = result;
    next();
};
exports.moderateMessageContent = moderateMessageContent;
