"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.getPostById = exports.getNetworkStats = exports.createPost = exports.getTrendingTags = exports.recordInteraction = exports.getFeed = void 0;
const Post_1 = __importDefault(require("../models/Post"));
const User_1 = __importDefault(require("../models/User"));
const UserInteraction_1 = __importDefault(require("../models/UserInteraction"));
const Follower_1 = __importDefault(require("../models/Follower"));
const notificationService_1 = require("../services/notificationService");
const moderationAI_1 = require("../services/moderationAI");
const feedAlgorithm_1 = require("../services/feedAlgorithm");
const socketManager_1 = require("../services/socketManager");
const PAGE_SIZE = 20;
// ─── GET /api/feed ─────────────────────────────────────────────────────────
const getFeed = async (req, res) => {
    try {
        const userId = req.user?.id;
        const mode = req.query.mode || (0, feedAlgorithm_1.detectFeedMode)();
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * PAGE_SIZE;
        // Build user context from interaction history
        let userMoods = [];
        let userHashtags = [];
        let followedAuthors = [];
        if (userId) {
            // Get recent 100 interactions for personalization
            const interactions = await UserInteraction_1.default.find({ userId })
                .sort({ createdAt: -1 })
                .limit(100)
                .lean();
            const moodCounts = {};
            const hashtagCounts = {};
            for (const i of interactions) {
                if (i.moodTag)
                    moodCounts[i.moodTag] = (moodCounts[i.moodTag] || 0) + 1;
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
            // Get followed authors
            const follows = await Follower_1.default.find({ followerId: userId }).lean();
            followedAuthors = follows.map((f) => f.followingId.toString());
        }
        const ctx = (0, feedAlgorithm_1.buildUserContext)(followedAuthors, userMoods, userHashtags, mode);
        // Fetch candidate posts
        let query = { isDeleted: false, moderationStatus: { $ne: 'removed' } };
        if (mode === 'following' && followedAuthors.length > 0) {
            query.author = { $in: followedAuthors };
        }
        else if (mode === 'trending') {
            const sixHoursAgo = new Date(Date.now() - 6 * 3600000);
            query.createdAt = { $gte: sixHoursAgo };
        }
        const candidatePosts = await Post_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(200) // Score from 200 candidates
            .populate('author', 'username displayName avatarColor')
            .lean();
        // Rank using algorithm
        const ranked = (0, feedAlgorithm_1.rankPosts)(candidatePosts, ctx);
        const paginated = ranked.slice(skip, skip + PAGE_SIZE);
        // Populate user-specific interactions
        if (userId) {
            const postIds = paginated.map((p) => p._id);
            const likes = await UserInteraction_1.default.find({ userId, postId: { $in: postIds }, interactionType: 'like' }).lean();
            const saves = await UserInteraction_1.default.find({ userId, postId: { $in: postIds }, interactionType: 'save' }).lean();
            const likedPostIds = new Set(likes.map(l => l.postId?.toString()).filter(Boolean));
            const savedPostIds = new Set(saves.map(s => s.postId?.toString()).filter(Boolean));
            const followedAuthorIds = new Set(followedAuthors);
            for (const post of paginated) {
                post.isLiked = likedPostIds.has(post._id.toString());
                post.isSaved = savedPostIds.has(post._id.toString());
                if (post.author) {
                    post.author.isFollowing = followedAuthorIds.has(post.author._id.toString());
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getFeed = getFeed;
// ─── POST /api/feed/interact ───────────────────────────────────────────────
const recordInteraction = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Auth required' });
        const { postId, interactionType, readDurationMs } = req.body;
        const post = await Post_1.default.findById(postId);
        if (!post)
            return res.status(404).json({ message: 'Post not found' });
        const updates = {};
        // Toggle logic for likes and saves
        if (interactionType === 'like' || interactionType === 'save') {
            const existing = await UserInteraction_1.default.findOne({ userId, postId, interactionType });
            if (existing) {
                // Unlike or Unsave
                await UserInteraction_1.default.deleteOne({ _id: existing._id });
                if (interactionType === 'like') {
                    updates.$inc = { likesCount: -1 };
                }
                if (interactionType === 'save')
                    updates.$inc = { savesCount: -1 };
            }
            else {
                // Like or Save
                await UserInteraction_1.default.create({
                    userId,
                    postId,
                    authorId: post.author,
                    interactionType,
                    moodTag: post.moodTag,
                    hashtags: post.hashtags,
                    readDurationMs: readDurationMs || 0,
                });
                if (interactionType === 'like') {
                    updates.$inc = { likesCount: 1 };
                    // Create notification for like
                    await (0, notificationService_1.createNotification)(post.author?.toString(), 'LIKE', userId, postId);
                }
                if (interactionType === 'save')
                    updates.$inc = { savesCount: 1 };
            }
        }
        else {
            // Normal interactions (view, share, comment)
            await UserInteraction_1.default.create({
                userId,
                postId,
                authorId: post.author,
                interactionType,
                moodTag: post.moodTag,
                hashtags: post.hashtags,
                readDurationMs: readDurationMs || 0,
            });
            if (interactionType === 'comment')
                updates.$inc = { commentsCount: 1 };
            else if (interactionType === 'view')
                updates.$inc = { viewsCount: 1 };
            else if (interactionType === 'share')
                updates.$inc = { repostsCount: 1 };
        }
        if (Object.keys(updates).length > 0) {
            const updated = await Post_1.default.findByIdAndUpdate(postId, updates, { new: true });
            if (updated) {
                // Recalculate engagement score
                const E = (Math.max(0, updated.likesCount) * 1) + (Math.max(0, updated.commentsCount) * 2) +
                    (Math.max(0, updated.savesCount) * 3) + (Math.max(0, updated.repostsCount) * 2) + (Math.max(0, updated.viewsCount) * 0.1);
                await Post_1.default.findByIdAndUpdate(postId, { engagementScore: E });
            }
        }
        res.json({ message: 'Interaction recorded' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.recordInteraction = recordInteraction;
// ─── GET /api/feed/trending-tags ─────────────────────────────────────────
const getTrendingTags = async (_req, res) => {
    try {
        const since = new Date(Date.now() - 24 * 3600000);
        const result = await Post_1.default.aggregate([
            { $match: { createdAt: { $gte: since }, isDeleted: false, moodTag: { $exists: true, $ne: '' } } },
            { $group: { _id: '$moodTag', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);
        res.json(result.map(r => ({ tag: r._id, count: r.count })));
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getTrendingTags = getTrendingTags;
// ─── POST /api/feed/posts ─────────────────────────────────────────────────
const createPost = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { content, moodTag } = req.body;
        const modResult = req.moderationResult;
        if ((0, moderationAI_1.detectSpamPost)(userId, content)) {
            return res.status(429).json({ message: 'You are posting too fast. Please wait.' });
        }
        // Extract hashtags
        const hashtags = (content.match(/#(\w+)/g) || []).map((t) => t.slice(1).toLowerCase());
        const post = await Post_1.default.create({
            author: userId,
            content,
            moodTag: moodTag || undefined,
            hashtags,
            toxicityScore: modResult?.toxicityScore || 0,
            isFlagged: modResult?.isFlagged || false,
            moderationStatus: modResult?.isFlagged ? 'review' : 'clear',
        });
        const populated = await post.populate('author', 'username displayName avatarColor');
        res.status(201).json(populated);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.createPost = createPost;
// ─── GET /api/feed/stats ───────────────────────────────────────────────────
const getNetworkStats = async (_req, res) => {
    try {
        const totalUsers = await User_1.default.countDocuments();
        const totalPosts = await Post_1.default.countDocuments({ isDeleted: false });
        // Get real-time active socket connections for Live Shadows
        const activeUsersCount = (0, socketManager_1.getActiveConnectionCount)();
        res.json({
            totalUsers,
            totalPosts,
            activeUsers: activeUsersCount > 0 ? activeUsersCount : 1, // ensure at least 1 is shown
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getNetworkStats = getNetworkStats;
// ─── GET /api/feed/posts/:id ───────────────────────────────────────────────
const getPostById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const post = await Post_1.default.findOne({ _id: req.params.id, isDeleted: false })
            .populate('author', 'username displayName avatarColor')
            .lean();
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        // Populate user-specific interactions
        if (userId) {
            const liked = await UserInteraction_1.default.findOne({ userId, postId: post._id, interactionType: 'like' }).lean();
            const saved = await UserInteraction_1.default.findOne({ userId, postId: post._id, interactionType: 'save' }).lean();
            post.isLiked = !!liked;
            post.isSaved = !!saved;
        }
        res.json(post);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getPostById = getPostById;
// ─── DELETE /api/feed/posts/:id ───────────────────────────────────────────────
const deletePost = async (req, res) => {
    try {
        const userId = req.user?.id;
        const postId = req.params.id;
        const post = await Post_1.default.findById(postId);
        if (!post)
            return res.status(404).json({ message: 'Post not found' });
        if (post.author?.toString() !== userId)
            return res.status(403).json({ message: 'Forbidden' });
        await Post_1.default.findByIdAndDelete(postId);
        // also delete interactions related to this post
        await UserInteraction_1.default.deleteMany({ postId });
        // Broadcast post deletion to all clients in real-time
        (0, socketManager_1.broadcastEvent)('post:deleted', { postId });
        res.json({ message: 'Post permanently deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.deletePost = deletePost;
