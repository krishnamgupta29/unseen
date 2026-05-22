import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Post from '../models/Post';
import User from '../models/User';

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content, moodTag, communityId } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const newPost = new Post({
      author: req.user.id,
      content,
      moodTag,
      community: communityId || undefined,
    });

    await newPost.save();

    const populatedPost = await newPost.populate('author', 'username displayName avatarUrl');

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatarUrl');

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
