"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getOnlineUsers = getOnlineUsers;
exports.getActiveConnectionCount = getActiveConnectionCount;
exports.isUserOnline = isUserOnline;
exports.broadcastEvent = broadcastEvent;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const encryption_1 = require("../services/encryption");
const Post_1 = __importDefault(require("../models/Post"));
const User_1 = __importDefault(require("../models/User"));
const connectedUsers = new Map();
let ioInstance = null;
function initSocket(server) {
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'https://unseen-world.vercel.app',
        'https://unseen-world.vercel.app',
        'https://unseen-social.vercel.app',
        'https://unseen-frontend.onrender.com',
        'http://localhost:3000',
        'http://localhost:3001',
    ];
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (allowedOrigins.some(o => origin.startsWith(o))) {
                    return callback(null, true);
                }
                const isLocal = origin.startsWith('http://localhost:') ||
                    origin === 'http://localhost' ||
                    origin.startsWith('http://127.0.0.1:') ||
                    origin === 'http://127.0.0.1' ||
                    origin.startsWith('http://10.0.2.2:') ||
                    origin === 'http://10.0.2.2' ||
                    /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
                    /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin) ||
                    /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin);
                if (isLocal) {
                    return callback(null, true);
                }
                callback(null, false);
            },
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });
    ioInstance = io;
    // ── Auth middleware for Socket.io ─────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.split(' ')[1];
        if (!token)
            return next(new Error('Authentication required'));
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            socket.user = decoded;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.user;
        // Register user presence
        connectedUsers.set(user.id, { userId: user.id, username: user.username, socketId: socket.id });
        // Broadcast online status
        socket.broadcast.emit('user:online', { userId: user.id });
        // ── Join personal room for DMs ─────────────────────────────────────
        socket.join(`user:${user.id}`);
        // ── Send message (real-time delivery) ──────────────────────────────
        socket.on('message:send', (data) => {
            const { receiverId, content } = data;
            if (!content?.trim())
                return;
            const { encryptedContent, iv } = (0, encryption_1.encrypt)(content.trim());
            const payload = {
                senderId: user.id,
                senderUsername: user.username,
                content, // sender sees plaintext immediately
                encryptedContent,
                iv,
                timestamp: new Date().toISOString(),
            };
            io.to(`user:${receiverId}`).emit('message:receive', {
                ...payload,
                content: (0, encryption_1.decrypt)(encryptedContent, iv), // decrypt for receiver
            });
            socket.emit('message:sent', { ...payload, receiverId });
        });
        // ── Typing indicators ──────────────────────────────────────────────
        socket.on('typing:start', (data) => {
            io.to(`user:${data.receiverId}`).emit('typing:start', { userId: user.id });
        });
        socket.on('typing:stop', (data) => {
            io.to(`user:${data.receiverId}`).emit('typing:stop', { userId: user.id });
        });
        // ── Read receipts ──────────────────────────────────────────────────
        socket.on('message:read', (data) => {
            io.to(`user:${data.senderId}`).emit('message:read', { readBy: user.id });
        });
        // ── Reactions ─────────────────────────────────────────────────────
        socket.on('reaction:add', (data) => {
            io.to(`user:${data.receiverId}`).emit('reaction:add', {
                messageId: data.messageId,
                userId: user.id,
                emoji: data.emoji,
            });
        });
        // ── Disconnect ────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            connectedUsers.delete(user.id);
            socket.broadcast.emit('user:offline', { userId: user.id });
        });
    });
    // Broadcast network stats & trending vibes every 5 seconds
    setInterval(async () => {
        try {
            const totalUsers = await User_1.default.countDocuments();
            const totalPosts = await Post_1.default.countDocuments({ isDeleted: false });
            const activeUsersCount = ioInstance ? ioInstance.engine.clientsCount : connectedUsers.size;
            const statsPayload = {
                totalUsers,
                totalPosts,
                activeUsers: activeUsersCount > 0 ? activeUsersCount : 1,
            };
            const since = new Date(Date.now() - 24 * 3600000);
            const trendingResult = await Post_1.default.aggregate([
                { $match: { createdAt: { $gte: since }, isDeleted: false, moodTag: { $exists: true, $ne: '' } } },
                { $group: { _id: '$moodTag', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
            ]);
            const trendingTags = trendingResult.map(r => ({ tag: r._id, count: r.count }));
            io.emit('network:stats', { stats: statsPayload, trending: trendingTags });
        }
        catch (e) {
            console.error('Error broadcasting network stats:', e);
        }
    }, 5000);
    return io;
}
function getOnlineUsers() {
    return Array.from(connectedUsers.keys());
}
function getActiveConnectionCount() {
    return ioInstance ? ioInstance.engine.clientsCount : 0;
}
function isUserOnline(userId) {
    return connectedUsers.has(userId);
}
function broadcastEvent(event, data) {
    if (ioInstance) {
        ioInstance.emit(event, data);
    }
}
