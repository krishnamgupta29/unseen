import { Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message';
import { AuthRequest } from '../middlewares/auth';
import { encrypt, decrypt } from '../services/encryption';

function getConversationId(a: string, b: string): string {
  return [a, b].sort().join('_');
}

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user!.id;
    const otherId = String(req.params.userId);
    const messages = await Message.find({ conversationId: getConversationId(myId, otherId), isDeleted: false })
      .sort({ createdAt: 1 }).limit(50).lean();
    const decrypted = messages.map(m => ({
      ...m,
      content: (() => { try { return decrypt(m.encryptedContent, m.iv); } catch { return '[Encrypted]'; } })(),
      encryptedContent: undefined, iv: undefined,
    }));
    await Message.updateMany({ conversationId: getConversationId(myId, otherId), receiver: myId, isRead: false }, { isRead: true, readAt: new Date() });
    res.json(decrypted);
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user!.id;
    const otherId = String(req.params.userId);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Empty message.' });
    const { encryptedContent, iv } = encrypt(content.trim());
    const message = await Message.create({ conversationId: getConversationId(myId, otherId), sender: myId, receiver: otherId, encryptedContent, iv });
    const obj = message.toObject ? message.toObject() : message;
    res.status(201).json({ ...obj, content, encryptedContent: undefined, iv: undefined });
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const message = await Message.findById(String(req.params.messageId));
    if (!message) return res.status(404).json({ message: 'Not found.' });
    if (message.sender.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden.' });
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();
    res.json({ message: 'Deleted.' });
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const myId = req.user!.id;
    
    // Validate that the user is part of this conversation
    // In our model, conversationId is built as `userA_userB`. We check if myId is included.
    if (!conversationId.includes(myId)) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    
    await Message.updateMany(
      { conversationId },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    
    res.json({ message: 'Conversation deleted.' });
  } catch (e: any) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const myId = new mongoose.Types.ObjectId(req.user!.id);
    const latest = await Message.aggregate([
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
        content = decrypt(c.lastMessage.encryptedContent, c.lastMessage.iv);
      } catch (e) {}
      
      const otherUser = String(c.lastMessage.sender) === String(myId) ? c.receiverInfo : c.senderInfo;
      
      // Skip conversations where the other user was deleted
      if (!otherUser) return null;
      
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
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

export const reactToMessage = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user!.id;
    const { messageId } = req.params;
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: 'Emoji is required.' });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found.' });

    const existingIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === myId && r.emoji === emoji
    );

    if (existingIndex > -1) {
      message.reactions.splice(existingIndex, 1);
    } else {
      const userReactionIndex = message.reactions.findIndex(
        (r) => r.userId.toString() === myId
      );
      if (userReactionIndex > -1) {
        message.reactions[userReactionIndex].emoji = emoji;
      } else {
        message.reactions.push({ userId: myId, emoji });
      }
    }

    await message.save();
    res.json({ messageId, reactions: message.reactions });
  } catch (e: any) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};
