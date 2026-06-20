"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.getPostById = exports.getNetworkStats = exports.createPost = exports.getTrendingTags = exports.recordInteraction = exports.getFeed = exports.invalidateTrendingCache = void 0;
const Post_1 = __importDefault(require("../models/Post"));
const User_1 = __importDefault(require("../models/User"));
const UserInteraction_1 = __importDefault(require("../models/UserInteraction"));
const Follower_1 = __importDefault(require("../models/Follower"));
const notificationService_1 = require("../services/notificationService");
const moderationAI_1 = require("../services/moderationAI");
const feedAlgorithm_1 = require("../services/feedAlgorithm");
const socketManager_1 = require("../services/socketManager");
let cachedTrendingTags = null;
let lastTrendingFetch = 0;
const invalidateTrendingCache = () => {
    cachedTrendingTags = null;
};
exports.invalidateTrendingCache = invalidateTrendingCache;
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
            // Run personalization + follower queries in PARALLEL instead of sequentially
            const [interactions, follows] = await Promise.all([
                UserInteraction_1.default.find({ userId })
                    .sort({ createdAt: -1 })
                    .limit(100)
                    .lean(),
                Follower_1.default.find({ followerId: userId }).lean(),
            ]);
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
            .limit(100) // Reduced from 200 for faster scoring
            .populate('author', 'username displayName avatarColor')
            .lean();
        // Rank using algorithm
        const ranked = (0, feedAlgorithm_1.rankPosts)(candidatePosts, ctx);
        const paginated = ranked.slice(skip, skip + PAGE_SIZE);
        // Populate user-specific interactions — run likes + saves in PARALLEL
        if (userId && paginated.length > 0) {
            const postIds = paginated.map((p) => p._id);
            const [likes, saves] = await Promise.all([
                UserInteraction_1.default.find({ userId, postId: { $in: postIds }, interactionType: 'like' }).lean(),
                UserInteraction_1.default.find({ userId, postId: { $in: postIds }, interactionType: 'save' }).lean(),
            ]);
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
        // Toggle logic for likes and saves
        if (interactionType === 'like' || interactionType === 'save') {
            const existing = await UserInteraction_1.default.findOne({ userId, postId, interactionType });
            if (existing) {
                // Unlike or Unsave
                await UserInteraction_1.default.deleteOne({ _id: existing._id });
                const countField = interactionType === 'like' ? 'likesCount' : 'savesCount';
                // Single atomic update: decrement count + recalculate engagement
                const updated = await Post_1.default.findByIdAndUpdate(postId, { $inc: { [countField]: -1 } }, { new: true });
                if (updated) {
                    const E = (Math.max(0, updated.likesCount) * 1) + (Math.max(0, updated.commentsCount) * 2) +
                        (Math.max(0, updated.savesCount) * 3) + (Math.max(0, updated.repostsCount) * 2) + (Math.max(0, updated.viewsCount) * 0.1);
                    updated.engagementScore = E;
                    await updated.save();
                }
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
                const countField = interactionType === 'like' ? 'likesCount' : 'savesCount';
                // Single atomic update: increment count + recalculate engagement
                const updated = await Post_1.default.findByIdAndUpdate(postId, { $inc: { [countField]: 1 } }, { new: true });
                if (updated) {
                    const E = (Math.max(0, updated.likesCount) * 1) + (Math.max(0, updated.commentsCount) * 2) +
                        (Math.max(0, updated.savesCount) * 3) + (Math.max(0, updated.repostsCount) * 2) + (Math.max(0, updated.viewsCount) * 0.1);
                    updated.engagementScore = E;
                    await updated.save();
                }
                if (interactionType === 'like') {
                    // Create notification for like (fire and forget)
                    (0, notificationService_1.createNotification)(post.author?.toString(), 'LIKE', userId, postId).catch(() => { });
                }
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
            let countField = null;
            if (interactionType === 'comment')
                countField = 'commentsCount';
            else if (interactionType === 'view')
                countField = 'viewsCount';
            else if (interactionType === 'share')
                countField = 'repostsCount';
            if (countField) {
                const updated = await Post_1.default.findByIdAndUpdate(postId, { $inc: { [countField]: 1 } }, { new: true });
                if (updated) {
                    const E = (Math.max(0, updated.likesCount) * 1) + (Math.max(0, updated.commentsCount) * 2) +
                        (Math.max(0, updated.savesCount) * 3) + (Math.max(0, updated.repostsCount) * 2) + (Math.max(0, updated.viewsCount) * 0.1);
                    updated.engagementScore = E;
                    await updated.save();
                }
            }
        }
        (0, exports.invalidateTrendingCache)();
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
        const now = Date.now();
        if (cachedTrendingTags && (now - lastTrendingFetch < 30000)) {
            return res.json(cachedTrendingTags);
        }
        let since = new Date(Date.now() - 24 * 3600000);
        let result = await Post_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: since },
                    isDeleted: false,
                    moderationStatus: { $ne: 'removed' },
                    moodTag: { $exists: true, $ne: '' }
                }
            },
            {
                $group: {
                    _id: '$moodTag',
                    count: { $sum: { $add: ['$likesCount', '$commentsCount', '$savesCount', '$repostsCount', 1] } }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);
        if (result.length === 0) {
            since = new Date(Date.now() - 7 * 24 * 3600000);
            result = await Post_1.default.aggregate([
                {
                    $match: {
                        createdAt: { $gte: since },
                        isDeleted: false,
                        moderationStatus: { $ne: 'removed' },
                        moodTag: { $exists: true, $ne: '' }
                    }
                },
                {
                    $group: {
                        _id: '$moodTag',
                        count: { $sum: { $add: ['$likesCount', '$commentsCount', '$savesCount', '$repostsCount', 1] } }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 },
            ]);
        }
        if (result.length === 0) {
            result = await Post_1.default.aggregate([
                {
                    $match: {
                        isDeleted: false,
                        moderationStatus: { $ne: 'removed' },
                        moodTag: { $exists: true, $ne: '' }
                    }
                },
                {
                    $group: {
                        _id: '$moodTag',
                        count: { $sum: { $add: ['$likesCount', '$commentsCount', '$savesCount', '$repostsCount', 1] } }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 },
            ]);
        }
        cachedTrendingTags = result.map(r => ({ tag: r._id, count: r.count }));
        lastTrendingFetch = now;
        res.json(cachedTrendingTags);
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
        (0, exports.invalidateTrendingCache)();
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
        const [totalUsers, totalPosts] = await Promise.all([
            User_1.default.countDocuments(),
            Post_1.default.countDocuments({ isDeleted: false }),
        ]);
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
        // Populate user-specific interactions in parallel
        if (userId) {
            const [liked, saved] = await Promise.all([
                UserInteraction_1.default.findOne({ userId, postId: post._id, interactionType: 'like' }).lean(),
                UserInteraction_1.default.findOne({ userId, postId: post._id, interactionType: 'save' }).lean(),
            ]);
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
        (0, exports.invalidateTrendingCache)();
        res.json({ message: 'Post permanently deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.deletePost = deletePost;
