import { Response } from 'express';
import Post from '../models/Post';
import User from '../models/User';
import UserInteraction from '../models/UserInteraction';
import Follower from '../models/Follower';
import { AuthRequest } from '../middlewares/auth';
import { createNotification } from '../services/notificationService';
import { detectSpamPost } from '../services/moderationAI';
import { detectFeedMode, buildUserContext, rankPosts } from '../services/feedAlgorithm';
import { getOnlineUsers, getActiveConnectionCount, broadcastEvent } from '../services/socketManager';

let cachedTrendingTags: any = null;
let lastTrendingFetch = 0;

export const invalidateTrendingCache = () => {
  cachedTrendingTags = null;
};

const PAGE_SIZE = 20;

// ─── GET /api/feed ─────────────────────────────────────────────────────────
export const getFeed = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const mode = (req.query.mode as string) || detectFeedMode();
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * PAGE_SIZE;

    // Build user context from interaction history
    let userMoods: string[] = [];
    let userHashtags: string[] = [];
    let followedAuthors: string[] = [];

    if (userId) {
      // Run personalization + follower queries in PARALLEL instead of sequentially
      const [interactions, follows] = await Promise.all([
        UserInteraction.find({ userId })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean(),
        Follower.find({ followerId: userId }).lean(),
      ]);

      const moodCounts: Record<string, number> = {};
      const hashtagCounts: Record<string, number> = {};

      for (const i of interactions) {
        if (i.moodTag) moodCounts[i.moodTag] = (moodCounts[i.moodTag] || 0) + 1;
        for (const tag of i.hashtags) {
          hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
        }
      }

      userMoods = Object.entries(moodCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([mood]) => mood);

      userHashtags = Object.entries(hashtagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([tag]) => tag);

      followedAuthors = follows.map((f: any) => f.followingId.toString());
    }

    const ctx = buildUserContext(
      followedAuthors,
      userMoods,
      userHashtags,
      mode as any
    );

    // Fetch candidate posts
    let query: any = { isDeleted: false, moderationStatus: { $ne: 'removed' } };

    if (mode === 'following' && followedAuthors.length > 0) {
      query.author = { $in: followedAuthors };
    } else if (mode === 'trending') {
      const sixHoursAgo = new Date(Date.now() - 6 * 3600000);
      query.createdAt = { $gte: sixHoursAgo };
    }

    const newerThan = req.query.newerThan as string;
    if (newerThan) {
      const newerDate = new Date(newerThan);
      if (query.createdAt) {
        query.createdAt = { $gt: newerDate, $gte: query.createdAt.$gte };
      } else {
        query.createdAt = { $gt: newerDate };
      }
    }

    const candidatePosts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(100) // Reduced from 200 for faster scoring
      .populate('author', 'username displayName avatarColor')
      .lean();

    // Rank using algorithm
    const ranked = rankPosts(candidatePosts as any, ctx);
    const paginated = ranked.slice(skip, skip + PAGE_SIZE);

    // Populate user-specific interactions — run likes + saves in PARALLEL
    if (userId && paginated.length > 0) {
      const postIds = paginated.map((p: any) => p._id);
      
      const [likes, saves] = await Promise.all([
        UserInteraction.find({ userId, postId: { $in: postIds }, interactionType: 'like' }).lean(),
        UserInteraction.find({ userId, postId: { $in: postIds }, interactionType: 'save' }).lean(),
      ]);
      
      const likedPostIds = new Set(likes.map(l => l.postId?.toString()).filter(Boolean));
      const savedPostIds = new Set(saves.map(s => s.postId?.toString()).filter(Boolean));
      const followedAuthorIds = new Set(followedAuthors);

      for (const post of paginated) {
        (post as any).isLiked = likedPostIds.has(post._id.toString());
        (post as any).isSaved = savedPostIds.has(post._id.toString());
        if ((post as any).author) {
          (post as any).author.isFollowing = followedAuthorIds.has((post as any).author._id.toString());
        }
      }
    }

    res.json({
      posts: paginated,
      page,
      hasMore: ranked.length > skip + PAGE_SIZE,
      mode,
      total: ranked.length,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── POST /api/feed/interact ───────────────────────────────────────────────
export const recordInteraction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Auth required' });

    const { postId, interactionType, readDurationMs } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Toggle logic for likes and saves
    if (interactionType === 'like' || interactionType === 'save') {
      const existing = await UserInteraction.findOne({ userId, postId, interactionType });
      const countField = interactionType === 'like' ? 'likesCount' : 'savesCount';
      
      if (existing) {
        // Unlike or Unsave
        await UserInteraction.deleteOne({ _id: existing._id });
        // Single atomic update: decrement count
        let updated = await Post.findByIdAndUpdate(
          postId,
          { $inc: { [countField]: -1 } },
          { new: true }
        );
        if (updated) {
          if ((updated as any)[countField] < 0) {
            (updated as any)[countField] = 0;
          }
          const E = (Math.max(0, updated.likesCount) * 1) + (Math.max(0, updated.commentsCount) * 2) +
            (Math.max(0, updated.savesCount) * 3) + (Math.max(0, updated.repostsCount) * 2) + (Math.max(0, updated.viewsCount) * 0.1);
          updated.engagementScore = E;
          await updated.save();

          // Broadcast updated counts for unlike/unsave
          broadcastEvent(`post:un${interactionType}d`, {
            postId,
            likesCount: updated.likesCount,
            savesCount: updated.savesCount,
            userId
          });
        }
      } else {
        // Like or Save
        await UserInteraction.create({
          userId,
          postId,
          authorId: post.author,
          interactionType,
          moodTag: post.moodTag,
          hashtags: post.hashtags,
          readDurationMs: readDurationMs || 0,
        });
        // Single atomic update: increment count
        let updated = await Post.findByIdAndUpdate(
          postId,
          { $inc: { [countField]: 1 } },
          { new: true }
        );
        if (updated) {
          if ((updated as any)[countField] < 0) {
            (updated as any)[countField] = 0;
          }
          const E = (Math.max(0, updated.likesCount) * 1) + (Math.max(0, updated.commentsCount) * 2) +
            (Math.max(0, updated.savesCount) * 3) + (Math.max(0, updated.repostsCount) * 2) + (Math.max(0, updated.viewsCount) * 0.1);
          updated.engagementScore = E;
          await updated.save();

          // Broadcast updated counts for like/save
          broadcastEvent(`post:${interactionType}d`, {
            postId,
            likesCount: updated.likesCount,
            savesCount: updated.savesCount,
            userId
          });
        }
        if (interactionType === 'like') {
          // Create notification for like (fire and forget)
          createNotification(post.author?.toString(), 'LIKE', userId, postId).catch(() => {});
        }
      }
    } else {
      // Normal interactions (view, share, comment)
      await UserInteraction.create({
        userId,
        postId,
        authorId: post.author,
        interactionType,
        moodTag: post.moodTag,
        hashtags: post.hashtags,
        readDurationMs: readDurationMs || 0,
      });

      let countField: string | null = null;
      if (interactionType === 'comment') countField = 'commentsCount';
      else if (interactionType === 'view') countField = 'viewsCount';
      else if (interactionType === 'share') countField = 'repostsCount';

      if (countField) {
        const updated = await Post.findByIdAndUpdate(
          postId,
          { $inc: { [countField]: 1 } },
          { new: true }
        );
        if (updated) {
          if ((updated as any)[countField] < 0) {
            (updated as any)[countField] = 0;
          }
          const E = (Math.max(0, updated.likesCount) * 1) + (Math.max(0, updated.commentsCount) * 2) +
            (Math.max(0, updated.savesCount) * 3) + (Math.max(0, updated.repostsCount) * 2) + (Math.max(0, updated.viewsCount) * 0.1);
          updated.engagementScore = E;
          await updated.save();
        }
      }
    }

    const isLiked = await UserInteraction.exists({ userId, postId, interactionType: 'like' });
    const isSaved = await UserInteraction.exists({ userId, postId, interactionType: 'save' });
    const freshPost = await Post.findById(postId);

    invalidateTrendingCache();
    res.json({
      message: 'Interaction recorded',
      isLiked: !!isLiked,
      isSaved: !!isSaved,
      likesCount: freshPost ? freshPost.likesCount : 0,
      savesCount: freshPost ? freshPost.savesCount : 0
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET /api/feed/trending-tags ─────────────────────────────────────────
export const getTrendingTags = async (_req: AuthRequest, res: Response) => {
  try {
    const now = Date.now();
    if (cachedTrendingTags && (now - lastTrendingFetch < 30000)) {
      return res.json(cachedTrendingTags);
    }

    let since = new Date(Date.now() - 24 * 3600000);
    let result = await Post.aggregate([
      { 
        $match: { 
          createdAt: { $gte: since }, 
          isDeleted: false, 
          moderationStatus: { $ne: 'removed' },
          moodTag: { $exists: true, $ne: '' } 
        } 
      },
      {
        $addFields: {
          normalizedMoodTag: { $toLower: { $trim: { input: '$moodTag' } } }
        }
      },
      { 
        $group: { 
          _id: '$normalizedMoodTag', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    if (result.length === 0) {
      since = new Date(Date.now() - 7 * 24 * 3600000);
      result = await Post.aggregate([
        { 
          $match: { 
            createdAt: { $gte: since }, 
            isDeleted: false, 
            moderationStatus: { $ne: 'removed' },
            moodTag: { $exists: true, $ne: '' } 
          } 
        },
        {
          $addFields: {
            normalizedMoodTag: { $toLower: { $trim: { input: '$moodTag' } } }
          }
        },
        { 
          $group: { 
            _id: '$normalizedMoodTag', 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);
    }

    if (result.length === 0) {
      result = await Post.aggregate([
        { 
          $match: { 
            isDeleted: false, 
            moderationStatus: { $ne: 'removed' },
            moodTag: { $exists: true, $ne: '' } 
          } 
        },
        {
          $addFields: {
            normalizedMoodTag: { $toLower: { $trim: { input: '$moodTag' } } }
          }
        },
        { 
          $group: { 
            _id: '$normalizedMoodTag', 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);
    }

    cachedTrendingTags = result.map(r => ({ tag: r._id, count: r.count }));
    lastTrendingFetch = now;

    res.json(cachedTrendingTags);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── POST /api/feed/posts ─────────────────────────────────────────────────
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { content, moodTag } = req.body;
    const modResult = (req as any).moderationResult;

    if (detectSpamPost(userId, content)) {
      return res.status(429).json({ message: 'You are posting too fast. Please wait.' });
    }

    // Extract and deduplicate hashtags
    const hashtags: string[] = Array.from(new Set<string>(
      (content.match(/#(\w+)/g) || []).map((t: string) => t.slice(1).toLowerCase())
    ));

    const normalizedMoodTag = moodTag ? moodTag.trim().toLowerCase() : undefined;

    const post = await Post.create({
      author: userId,
      content,
      moodTag: normalizedMoodTag,
      hashtags,
      toxicityScore: modResult?.toxicityScore || 0,
      isFlagged: modResult?.isFlagged || false,
      moderationStatus: modResult?.isFlagged ? 'review' : 'clear',
    });

    const populated = await post.populate('author', 'username displayName avatarColor');

    // Broadcast new post creation event
    broadcastEvent('post:created', populated);

    invalidateTrendingCache();
    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET /api/feed/stats ───────────────────────────────────────────────────
export const getNetworkStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalPosts] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ isDeleted: false }),
    ]);
    
    // Get real-time active socket connections for Live Shadows
    const activeUsersCount = getActiveConnectionCount();
    
    res.json({
      totalUsers,
      totalPosts,
      activeUsers: activeUsersCount > 0 ? activeUsersCount : 1, // ensure at least 1 is shown
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET /api/feed/posts/:id ───────────────────────────────────────────────
export const getPostById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false })
      .populate('author', 'username displayName avatarColor')
      .lean();
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Populate user-specific interactions in parallel
    if (userId) {
      const [liked, saved] = await Promise.all([
        UserInteraction.findOne({ userId, postId: post._id, interactionType: 'like' }).lean(),
        UserInteraction.findOne({ userId, postId: post._id, interactionType: 'save' }).lean(),
      ]);
      (post as any).isLiked = !!liked;
      (post as any).isSaved = !!saved;
    }
    
    res.json(post);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── DELETE /api/feed/posts/:id ───────────────────────────────────────────────
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author?.toString() !== userId) return res.status(403).json({ message: 'Forbidden' });
    await Post.findByIdAndDelete(postId);
    // also delete interactions related to this post
    await UserInteraction.deleteMany({ postId });
    
    // Broadcast post deletion to all clients in real-time
    broadcastEvent('post:deleted', { postId });
    
    invalidateTrendingCache();
    res.json({ message: 'Post permanently deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
