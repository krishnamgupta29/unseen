import { Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import Follower from '../models/Follower';
import { AuthRequest } from '../middlewares/auth';
import UserInteraction from '../models/UserInteraction';
import Report from '../models/Report';
import mongoose from 'mongoose';
import { createNotification } from '../services/notificationService';
import { broadcastEvent } from '../services/socketManager';
import Comment from '../models/Comment';
import Message from '../models/Message';
import Notification from '../models/Notification';
import RefreshToken from '../models/RefreshToken';

// ─── GET /api/users/:id ────────────────────────────────────────────────────
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user?.id;

    // Run ALL queries in parallel instead of sequentially
    const [user, followersCount, followingCount, followDoc] = await Promise.all([
      User.findById(userId).select('-passwordHash -loginAttempts -lockUntil').lean(),
      Follower.countDocuments({ following: userId }),
      Follower.countDocuments({ follower: userId }),
      currentUserId
        ? Follower.findOne({ follower: currentUserId, following: userId }).lean()
        : Promise.resolve(null),
    ]);

    if (!user || user.isSuspended) return res.status(404).json({ message: 'User not found' });

    const isFollowing = !!followDoc;

    // If cached counts in user document are stale, update them silently in background
    if (user.followersCount !== followersCount || user.followingCount !== followingCount) {
      User.findByIdAndUpdate(user._id, { followersCount, followingCount }).catch(() => {});
    }

    res.json({
      ...user,
      followersCount,
      followingCount,
      isFollowing
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET /api/users/:id/posts ──────────────────────────────────────────────
export const getUserPosts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: req.params.id, isDeleted: false, moderationStatus: { $ne: 'removed' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatarColor')
      .lean();

    // Populate user-specific interactions
    const currentUserId = req.user?.id;
    if (currentUserId && posts.length > 0) {
      const postIds = posts.map((p: any) => p._id);
      const likes = await UserInteraction.find({ userId: currentUserId, postId: { $in: postIds }, interactionType: 'like' }).lean();
      const saves = await UserInteraction.find({ userId: currentUserId, postId: { $in: postIds }, interactionType: 'save' }).lean();
      
      const likedPostIds = new Set(likes.map(l => l.postId?.toString()).filter(Boolean));
      const savedPostIds = new Set(saves.map(s => s.postId?.toString()).filter(Boolean));

      for (const post of posts) {
        (post as any).isLiked = likedPostIds.has(post._id.toString());
        (post as any).isSaved = savedPostIds.has(post._id.toString());
      }
    }

    const total = await Post.countDocuments({ author: req.params.id, isDeleted: false, moderationStatus: { $ne: 'removed' } });

    res.json({ posts, hasMore: skip + posts.length < total });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── POST /api/users/:id/follow ────────────────────────────────────────────
export const toggleFollow = async (req: AuthRequest, res: Response) => {
  try {
    const followerId = req.user!.id;
    const followingId = req.params.id as string;

    if (followerId === followingId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const existing = await Follower.findOne({ follower: followerId, following: followingId });

    let isFollowing = false;
    if (existing) {
      await existing.deleteOne();
      isFollowing = false;
    } else {
      await Follower.create({ follower: followerId, following: followingId });
      await createNotification(followingId, 'FOLLOW', followerId);
      isFollowing = true;
    }

    // Enforce counts recalculation from the Follower collection to self-heal drifts
    const followingUserFollowersCount = await Follower.countDocuments({ following: followingId });
    await User.findByIdAndUpdate(followingId, { followersCount: followingUserFollowersCount });

    const followerUserFollowingCount = await Follower.countDocuments({ follower: followerId });
    await User.findByIdAndUpdate(followerId, { followingCount: followerUserFollowingCount });

    // Broadcast the follow update to all clients in real-time
    broadcastEvent('follow:update', {
      followerId,
      followingId,
      isFollowing,
      followersCount: followingUserFollowersCount,
      followingCount: followerUserFollowingCount
    });

    return res.json({
      message: isFollowing ? 'Followed' : 'Unfollowed',
      isFollowing,
      followersCount: followingUserFollowersCount,
      followingCount: followerUserFollowingCount
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET /api/users/:id/followers ──────────────────────────────────────────
export const getFollowers = async (req: AuthRequest, res: Response) => {
  try {
    const followers = await Follower.find({ following: req.params.id })
      .populate('follower', 'username displayName avatarColor bio followersCount followingCount')
      .lean();

    const followerUsers: any[] = followers.map((f: any) => f.follower).filter(Boolean);

    // Annotate each user with whether the current user is already following them
    if (req.user?.id && followerUsers.length > 0) {
      const currentUserFollows = await Follower.find({
        follower: req.user.id,
        following: { $in: followerUsers.map((u: any) => u._id) },
      }).lean();
      const followingSet = new Set(currentUserFollows.map((f: any) => f.following.toString()));
      for (const u of followerUsers) {
        u.isFollowing = followingSet.has(u._id.toString());
      }
    }

    res.json(followerUsers);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET /api/users/:id/following ──────────────────────────────────────────
export const getFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const following = await Follower.find({ follower: req.params.id })
      .populate('following', 'username displayName avatarColor bio followersCount followingCount')
      .lean();

    const followingUsers: any[] = following.map((f: any) => f.following).filter(Boolean);

    // Annotate each user with whether the current user is already following them
    if (req.user?.id && followingUsers.length > 0) {
      const currentUserFollows = await Follower.find({
        follower: req.user.id,
        following: { $in: followingUsers.map((u: any) => u._id) },
      }).lean();
      const followingSet = new Set(currentUserFollows.map((f: any) => f.following.toString()));
      for (const u of followingUsers) {
        u.isFollowing = followingSet.has(u._id.toString());
      }
    }

    res.json(followingUsers);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET /api/users/:id/saved ──────────────────────────────────────────────
export const getSavedPosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    // Check if the request is for the currently logged in user
    if (req.user?.id !== userId) {
      return res.status(403).json({ message: 'You can only view your own saved posts.' });
    }

    const savedInteractions = await UserInteraction.find({ userId: new mongoose.Types.ObjectId(userId as string), interactionType: 'save' })
      .sort({ createdAt: -1 })
      .lean();

    const postIds = savedInteractions.map(i => i.postId).filter(Boolean) as mongoose.Types.ObjectId[];
    const savedPosts = await Post.find({ _id: { $in: postIds }, isDeleted: false })
      .populate('author', 'username displayName avatarColor')
      .lean();

    // Map to preserve sorting order based on save time
    const sortedPosts = postIds.map(id => savedPosts.find(p => p._id.toString() === id.toString())).filter(Boolean);

    // Populate user-specific interactions
    const currentUserId = req.user?.id;
    if (currentUserId && sortedPosts.length > 0) {
      const sortedPostIds = sortedPosts.map((p: any) => p?._id).filter(Boolean);
      const likes = await UserInteraction.find({ userId: currentUserId, postId: { $in: sortedPostIds }, interactionType: 'like' }).lean();
      const saves = await UserInteraction.find({ userId: currentUserId, postId: { $in: sortedPostIds }, interactionType: 'save' }).lean();
      
      const likedPostIds = new Set(likes.map(l => l.postId?.toString()).filter(Boolean));
      const savedPostIds = new Set(saves.map(s => s.postId?.toString()).filter(Boolean));

      for (const post of sortedPosts) {
        if (post) {
          (post as any).isLiked = likedPostIds.has((post as any)._id.toString());
          (post as any).isSaved = savedPostIds.has((post as any)._id.toString());
        }
      }
    }

    res.json({ posts: sortedPosts });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET /api/users/search ─────────────────────────────────────────────────
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) return res.json([]);

    const regex = new RegExp(query, 'i');
    const users = await User.find({
      $or: [{ username: regex }, { displayName: regex }],
      isSuspended: false
    })
      .select('username displayName avatarColor bio')
      .limit(10)
      .lean();

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── PUT /api/users/profile ────────────────────────────────────────────────
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Auth required' });
    const { displayName, bio } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { displayName, bio },
      { new: true, runValidators: true }
    ).select('-passwordHash -loginAttempts -lockUntil').lean();
    
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── POST /api/users/:id/report ────────────────────────────────────────────
export const reportUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Auth required' });
    const targetId = req.params.id;
    const { reason, contentId, contentType } = req.body;

    if (req.user.id === targetId) return res.status(400).json({ message: 'Cannot report yourself' });

    // Ensure they haven't reported this user already for the same content
    const query: any = { reporter: new mongoose.Types.ObjectId(req.user.id) };
    if (contentType === 'post') {
      query.reportedPost = new mongoose.Types.ObjectId(contentId as string);
    } else {
      query.reportedUser = new mongoose.Types.ObjectId(targetId as string);
    }

    const existing = await Report.findOne(query);
    if (existing) {
      return res.status(400).json({ message: 'You have already reported this.' });
    }

    const reportData: any = {
      reporter: new mongoose.Types.ObjectId(req.user.id),
      reason: reason || 'Inappropriate behavior',
      status: 'PENDING'
    };

    if (contentType === 'post') {
      reportData.reportedPost = new mongoose.Types.ObjectId(contentId as string);
    } else {
      reportData.reportedUser = new mongoose.Types.ObjectId(targetId as string);
    }

    await Report.create(reportData);

    // Auto-ban logic
    const distinctReports = await Report.distinct('reporter', { reportedUser: new mongoose.Types.ObjectId(targetId as string) });
    if (distinctReports.length >= 5) {
      await User.findByIdAndUpdate(targetId, {
        isSuspended: true,
        suspendReason: 'Auto-suspended due to multiple community reports'
      });
    }

    await createNotification(targetId as string, 'REPORT', req.user.id as string, contentId as string, reason as string);

    res.json({ message: 'Report submitted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── DELETE /api/users/profile ──────────────────────────────────────────────
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Auth required' });

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Delete user document (Core action)
    await User.findByIdAndDelete(userObjectId);

    // Run other cleanups safely (so if one model delete fails, it does not abort the whole deletion)
    const cleanups = [
      () => Post.deleteMany({ author: userObjectId }),
      () => Comment.deleteMany({ author: userObjectId }),
      () => Follower.deleteMany({ $or: [{ follower: userObjectId }, { following: userObjectId }] }),
      () => UserInteraction.deleteMany({ userId: userObjectId }),
      () => Report.deleteMany({ $or: [{ reporter: userObjectId }, { reportedUser: userObjectId }] }),
      () => RefreshToken.deleteMany({ userId: userObjectId }),
      () => Message.deleteMany({ $or: [{ sender: userObjectId }, { receiver: userObjectId }] }),
      () => Notification.deleteMany({ $or: [{ recipient: userObjectId }, { sender: userObjectId }] })
    ];

    for (const cleanup of cleanups) {
      try {
        await cleanup();
      } catch (err: any) {
        console.error('Secondary cleanup failed during account deletion:', err.message);
      }
    }

    res.json({ message: 'Account permanently deleted' });
  } catch (error: any) {
    console.error('Core user deletion failed:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
