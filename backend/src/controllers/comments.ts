import { Response } from 'express';
import Comment from '../models/Comment';
import Post from '../models/Post';
import UserInteraction from '../models/UserInteraction';
import { AuthRequest } from '../middlewares/auth';
import mongoose from 'mongoose';
import { createNotification } from '../services/notificationService';
import { broadcastEvent } from '../services/socketManager';

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: new mongoose.Types.ObjectId(postId as string), isDeleted: false })
      .populate('author', 'username displayName avatarColor')
      .sort({ createdAt: -1 })
      .lean();

    // Check if the current user has liked any of these comments
    let commentsWithLikes = comments;
    if (req.user?.id) {
      const commentIds = comments.map(c => c._id);
      const likes = await UserInteraction.find({
        userId: new mongoose.Types.ObjectId(req.user.id),
        commentId: { $in: commentIds },
        interactionType: 'like_comment'
      }).lean();

      const likedCommentIds = new Set(likes.map(l => l.commentId?.toString()));
      commentsWithLikes = comments.map(c => ({
        ...c,
        isLiked: likedCommentIds.has(c._id.toString())
      })) as any;
    }

    res.json(commentsWithLikes);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Auth required' });
    const { postId } = req.params;
    const { content, parentComment } = req.body;

    if (!content) return res.status(400).json({ message: 'Content is required' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({
      author: new mongoose.Types.ObjectId(req.user.id),
      post: new mongoose.Types.ObjectId(postId as string),
      parentComment: parentComment ? new mongoose.Types.ObjectId(parentComment as string) : undefined,
      content
    }) as any;

    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
    
    // Send notifications
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent && parent.author) {
        await createNotification(parent.author.toString(), 'COMMENT', req.user.id, postId as string);
      }
    } else {
      if (post && post.author) {
        await createNotification(post.author.toString(), 'COMMENT', req.user.id, postId as string);
      }
    }

    // Fetch author details to return with comment
    await comment.populate('author', 'username displayName avatarColor');

    // Broadcast comment creation event via sockets
    broadcastEvent('comment:created', { postId, comment });

    // Return the new comment
    res.json(comment);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const toggleLikeComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Auth required' });
    const { commentId } = req.params;

    const existing = await UserInteraction.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id),
      commentId: new mongoose.Types.ObjectId(commentId as string),
      interactionType: 'like_comment'
    });

    if (existing) {
      await existing.deleteOne();
      await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } });
      res.json({ message: 'Unliked', isLiked: false });
    } else {
      await UserInteraction.create({
        userId: new mongoose.Types.ObjectId(req.user.id),
        commentId: new mongoose.Types.ObjectId(commentId as string),
        interactionType: 'like_comment'
      });
      await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } });
      res.json({ message: 'Liked', isLiked: true });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Auth required' });
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Verify ownership
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    comment.isDeleted = true;
    await comment.save();

    // Decrement post comments count
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    // Broadcast comment deleted event via sockets
    broadcastEvent('comment:deleted', { postId: comment.post.toString(), commentId });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
