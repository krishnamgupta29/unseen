import { Server as HTTPServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { encrypt, decrypt } from '../services/encryption';
import Post from '../models/Post';
import User from '../models/User';

interface ConnectedUser {
  userId: string;
  username: string;
  socketId: string;
}

const connectedUsers = new Map<string, ConnectedUser>();
let ioInstance: SocketServer | null = null;

export function initSocket(server: HTTPServer): SocketServer {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'https://unseen-world.vercel.app',
    'https://unseen-world.vercel.app',
    'https://unseen-social.vercel.app',
    'https://unseen-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  const io = new SocketServer(server, {
    cors: {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return callback(null, true);
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
  io.use(async (socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        id: string; username: string; role?: string; sessionId?: string;
      };
      const user = await User.findById(decoded.id).select('currentSessionId isActive isSuspended').lean();
      if (!user || !user.isActive || user.isSuspended || decoded.sessionId !== user.currentSessionId) {
        return next(new Error('Session invalidated or inactive account'));
      }
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as { id: string; username: string };

    // Register user presence
    connectedUsers.set(user.id, { userId: user.id, username: user.username, socketId: socket.id });

    // Broadcast online status
    socket.broadcast.emit('user:online', { userId: user.id });

    // ── Join personal room for DMs ─────────────────────────────────────
    socket.join(`user:${user.id}`);

    // ── Send message (real-time delivery) ──────────────────────────────
    socket.on('message:send', (data: { receiverId: string; content: string }) => {
      const { receiverId, content } = data;
      if (!content?.trim()) return;

      const { encryptedContent, iv } = encrypt(content.trim());

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
        content: decrypt(encryptedContent, iv), // decrypt for receiver
      });

      socket.emit('message:sent', { ...payload, receiverId });
    });

    // ── Typing indicators ──────────────────────────────────────────────
    socket.on('typing:start', (data: { receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('typing:start', { userId: user.id });
    });

    socket.on('typing:stop', (data: { receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('typing:stop', { userId: user.id });
    });

    // ── Read receipts ──────────────────────────────────────────────────
    socket.on('message:read', (data: { senderId: string }) => {
      io.to(`user:${data.senderId}`).emit('message:read', { readBy: user.id });
    });

    // ── Reactions ─────────────────────────────────────────────────────
    socket.on('reaction:add', (data: { messageId: string; receiverId: string; emoji: string }) => {
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

  // Broadcast network stats & trending vibes every 60 seconds (reduced from 5s to cut DB load)
  setInterval(async () => {
    try {
      const totalUsers = await User.countDocuments();
      const totalPosts = await Post.countDocuments({ isDeleted: false });
      const activeUsersCount = ioInstance ? ioInstance.engine.clientsCount : connectedUsers.size;
      
      const statsPayload = {
        totalUsers,
        totalPosts,
        activeUsers: activeUsersCount > 0 ? activeUsersCount : 1,
      };

      const since = new Date(Date.now() - 24 * 3600000);
      const trendingResult = await Post.aggregate([
        { $match: { createdAt: { $gte: since }, isDeleted: false, moodTag: { $exists: true, $ne: '' } } },
        { $group: { _id: '$moodTag', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);
      const trendingTags = trendingResult.map(r => ({ tag: r._id, count: r.count }));

      io.emit('network:stats', { stats: statsPayload, trending: trendingTags });
    } catch (e) {
      console.error('Error broadcasting network stats:', e);
    }
  }, 60000);

  return io;
}

export function getOnlineUsers(): string[] {
  return Array.from(connectedUsers.keys());
}

export function getActiveConnectionCount(): number {
  return ioInstance ? ioInstance.engine.clientsCount : 0;
}

export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId);
}

export function broadcastEvent(event: string, data: any) {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}

export function invalidateUserSessions(userId: string, activeSessionId: string) {
  if (!ioInstance) return;
  const roomName = `user:${userId}`;
  const sockets = ioInstance.sockets.adapter.rooms.get(roomName);
  if (sockets) {
    const socketIds = Array.from(sockets);
    for (const socketId of socketIds) {
      const socket = ioInstance.sockets.sockets.get(socketId);
      if (socket) {
        const socketUser = (socket as any).user;
        if (socketUser && socketUser.sessionId !== activeSessionId) {
          socket.emit('session:terminated', {
            message: 'Your account has been logged in on another device. This session has been ended for security reasons.'
          });
          socket.disconnect(true);
        }
      }
    }
  }
}
