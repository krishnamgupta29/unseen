"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllRead = exports.listNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const listNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Auth required' });
        const notifs = await Notification_1.default.find({ recipient: userId })
            .populate('sender', 'username displayName avatarColor')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        // Transform for frontend (add fromUserId and fromUser object)
        const formatted = notifs.map(n => {
            const sender = n.sender;
            return {
                id: n._id.toString(),
                type: n.type,
                fromUserId: sender?._id?.toString() || null,
                fromUser: sender ? {
                    id: sender._id.toString(),
                    displayName: sender.displayName,
                    username: sender.username,
                    avatarColor: sender.avatarColor,
                } : null,
                postId: n.post?.toString() || null,
                reason: n.reason || null,
                isRead: n.isRead,
                timeAgo: new Date(n.createdAt).toLocaleString(),
            };
        });
        res.json(formatted);
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.listNotifications = listNotifications;
// Mark all notifications as read for the user
const markAllRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Auth required' });
        await Notification_1.default.updateMany({ recipient: userId, isRead: false }, { isRead: true, updatedAt: new Date() });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.markAllRead = markAllRead;
