"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
const Notification_1 = __importDefault(require("../models/Notification"));
/**
 * Create a notification record.
 * @param recipientId - user who will receive the notification
 * @param type - type of notification (LIKE, COMMENT, FOLLOW, REPOST, SYSTEM, REPORT)
 * @param senderId - optional user who triggered the notification
 * @param postId - optional post related to the notification
 * @param reason - optional reason (used for REPORT notifications)
 */
async function createNotification(recipientId, type, senderId, postId, reason) {
    // Prevent creating a notification for self actions (e.g., liking own post)
    if (senderId && senderId === recipientId)
        return;
    const notif = await Notification_1.default.create({
        recipient: recipientId,
        sender: senderId,
        type,
        post: postId,
        reason: reason || undefined,
        isRead: false,
    });
    try {
        const { sendToUser } = require('./socketManager');
        sendToUser(recipientId, 'notification:new', notif);
    }
    catch (err) {
        console.error('Failed to emit socket notification:', err);
    }
    return notif;
}
