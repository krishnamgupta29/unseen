import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';

export const listNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Auth required' });

    const notifs = await Notification.find({ recipient: userId })
      .populate('sender', 'username displayName avatarColor')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Transform for frontend (add fromUserId and fromUser object)
    const formatted = notifs.map(n => {
      const sender = n.sender as any;
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
        reason: (n as any).reason || null,
        isRead: n.isRead,
        timeAgo: new Date(n.createdAt).toLocaleString(),
      };
    });

    res.json(formatted);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

// Mark all notifications as read for the user
export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Auth required' });
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true, updatedAt: new Date() });
    res.json({ message: 'All notifications marked as read' });
  } catch (e: any) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};
