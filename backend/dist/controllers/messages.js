"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactToMessage = exports.getConversations = exports.deleteConversation = exports.deleteMessage = exports.sendMessage = exports.getMessages = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Message_1 = __importDefault(require("../models/Message"));
const encryption_1 = require("../services/encryption");
function getConversationId(a, b) {
    return [a, b].sort().join('_');
}
const getMessages = async (req, res) => {
    try {
        const myId = req.user.id;
        const otherId = String(req.params.userId);
        const before = req.query.before;
        const query = {
            conversationId: getConversationId(myId, otherId),
            isDeleted: false
        };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }
        const messages = await Message_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        const reversed = messages.reverse();
        const decrypted = reversed.map(m => ({
            ...m,
            content: (() => { try {
                return (0, encryption_1.decrypt)(m.encryptedContent, m.iv);
            }
            catch {
                return '[Encrypted]';
            } })(),
            encryptedContent: undefined, iv: undefined,
        }));
        await Message_1.default.updateMany({ conversationId: getConversationId(myId, otherId), receiver: myId, isRead: false }, { isRead: true, readAt: new Date() });
        const { sendToUser } = require('../services/socketManager');
        sendToUser(myId, 'message:read', { readBy: myId, conversationId: getConversationId(myId, otherId) });
        sendToUser(otherId, 'message:read', { readBy: myId, conversationId: getConversationId(myId, otherId) });
        res.json(decrypted);
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res) => {
    try {
        const myId = req.user.id;
        const otherId = String(req.params.userId);
        const { content } = req.body;
        if (!content?.trim())
            return res.status(400).json({ message: 'Empty message.' });
        const { encryptedContent, iv } = (0, encryption_1.encrypt)(content.trim());
        const message = await Message_1.default.create({ conversationId: getConversationId(myId, otherId), sender: myId, receiver: otherId, encryptedContent, iv });
        const obj = message.toObject ? message.toObject() : message;
        const payload = { ...obj, content, encryptedContent: undefined, iv: undefined };
        const { sendToUser } = require('../services/socketManager');
        sendToUser(otherId, 'message:receive', payload);
        sendToUser(myId, 'message:receive', payload);
        res.status(201).json(payload);
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.sendMessage = sendMessage;
const deleteMessage = async (req, res) => {
    try {
        const message = await Message_1.default.findById(String(req.params.messageId));
        if (!message)
            return res.status(404).json({ message: 'Not found.' });
        if (message.sender.toString() !== req.user.id)
            return res.status(403).json({ message: 'Forbidden.' });
        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();
        res.json({ message: 'Deleted.' });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.deleteMessage = deleteMessage;
const deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const myId = req.user.id;
        // Validate that the user is part of this conversation
        // In our model, conversationId is built as `userA_userB`. We check if myId is included.
        if (!conversationId.includes(myId)) {
            return res.status(403).json({ message: 'Forbidden.' });
        }
        await Message_1.default.updateMany({ conversationId }, { $set: { isDeleted: true, deletedAt: new Date() } });
        res.json({ message: 'Conversation deleted.' });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.deleteConversation = deleteConversation;
const getConversations = async (req, res) => {
    try {
        const myId = new mongoose_1.default.Types.ObjectId(req.user.id);
        const latest = await Message_1.default.aggregate([
            { $match: { $or: [{ sender: myId }, { receiver: myId }], isDeleted: false } },
            { $sort: { createdAt: -1 } },
            { $group: {
                    _id: '$conversationId',
                    lastMessage: { $first: '$$ROOT' },
                    unread: { $sum: { $cond: [{ $and: [{ $eq: ['$receiver', myId] }, { $eq: ['$isRead', false] }] }, 1, 0] } }
                }
            },
            { $sort: { 'lastMessage.createdAt': -1 } },
            { $limit: 50 },
            { $lookup: {
                    from: 'users',
                    localField: 'lastMessage.sender',
                    foreignField: '_id',
                    as: 'senderInfo'
                }
            },
            { $lookup: {
                    from: 'users',
                    localField: 'lastMessage.receiver',
                    foreignField: '_id',
                    as: 'receiverInfo'
                }
            },
            { $unwind: { path: '$senderInfo', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$receiverInfo', preserveNullAndEmptyArrays: true } },
        ]);
        const decrypted = latest.map(c => {
            let content = '[Encrypted]';
            try {
                content = (0, encryption_1.decrypt)(c.lastMessage.encryptedContent, c.lastMessage.iv);
            }
            catch (e) { }
            const otherUser = String(c.lastMessage.sender) === String(myId) ? c.receiverInfo : c.senderInfo;
            // Skip conversations where the other user was deleted
            if (!otherUser)
                return null;
            return {
                conversationId: c._id,
                unreadCount: c.unread,
                lastMessage: {
                    ...c.lastMessage,
                    content,
                    encryptedContent: undefined,
                    iv: undefined
                },
                participant: {
                    _id: otherUser._id,
                    username: otherUser.username,
                    displayName: otherUser.displayName,
                    avatarColor: otherUser.avatarColor
                }
            };
        });
        res.json(decrypted.filter(Boolean));
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.getConversations = getConversations;
const reactToMessage = async (req, res) => {
    try {
        const myId = req.user.id;
        const { messageId } = req.params;
        const { emoji } = req.body;
        if (!emoji)
            return res.status(400).json({ message: 'Emoji is required.' });
        const message = await Message_1.default.findById(messageId);
        if (!message)
            return res.status(404).json({ message: 'Message not found.' });
        const existingIndex = message.reactions.findIndex((r) => r.userId.toString() === myId && r.emoji === emoji);
        if (existingIndex > -1) {
            message.reactions.splice(existingIndex, 1);
        }
        else {
            const userReactionIndex = message.reactions.findIndex((r) => r.userId.toString() === myId);
            if (userReactionIndex > -1) {
                message.reactions[userReactionIndex].emoji = emoji;
            }
            else {
                message.reactions.push({ userId: myId, emoji });
            }
        }
        await message.save();
        res.json({ messageId, reactions: message.reactions });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.reactToMessage = reactToMessage;
