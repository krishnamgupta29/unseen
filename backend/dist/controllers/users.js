"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.reportUser = exports.updateProfile = exports.searchUsers = exports.getSavedPosts = exports.getFollowing = exports.getFollowers = exports.toggleFollow = exports.getUserPosts = exports.getUserProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const Post_1 = __importDefault(require("../models/Post"));
const Follower_1 = __importDefault(require("../models/Follower"));
const UserInteraction_1 = __importDefault(require("../models/UserInteraction"));
const Report_1 = __importDefault(require("../models/Report"));
const mongoose_1 = __importDefault(require("mongoose"));
const notificationService_1 = require("../services/notificationService");
const socketManager_1 = require("../services/socketManager");
const Comment_1 = __importDefault(require("../models/Comment"));
const Message_1 = __importDefault(require("../models/Message"));
const Notification_1 = __importDefault(require("../models/Notification"));
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
// ─── GET /api/users/:id ────────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const currentUserId = req.user?.id;
        // Run ALL queries in parallel instead of sequentially
        const [user, followersCount, followingCount, followDoc] = await Promise.all([
            User_1.default.findById(userId).select('-passwordHash -loginAttempts -lockUntil').lean(),
            Follower_1.default.countDocuments({ following: userId }),
            Follower_1.default.countDocuments({ follower: userId }),
            currentUserId
                ? Follower_1.default.findOne({ follower: currentUserId, following: userId }).lean()
                : Promise.resolve(null),
        ]);
        if (!user || user.isSuspended)
            return res.status(404).json({ message: 'User not found' });
        const isFollowing = !!followDoc;
        // If cached counts in user document are stale, update them silently in background
        if (user.followersCount !== followersCount || user.followingCount !== followingCount) {
            User_1.default.findByIdAndUpdate(user._id, { followersCount, followingCount }).catch(() => { });
        }
        res.json({
            ...user,
            followersCount,
            followingCount,
            isFollowing
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getUserProfile = getUserProfile;
// ─── GET /api/users/:id/posts ──────────────────────────────────────────────
const getUserPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const posts = await Post_1.default.find({ author: req.params.id, isDeleted: false, moderationStatus: { $ne: 'removed' } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username displayName avatarColor')
            .lean();
        // Populate user-specific interactions
        const currentUserId = req.user?.id;
        if (currentUserId && posts.length > 0) {
            const postIds = posts.map((p) => p._id);
            const likes = await UserInteraction_1.default.find({ userId: currentUserId, postId: { $in: postIds }, interactionType: 'like' }).lean();
            const saves = await UserInteraction_1.default.find({ userId: currentUserId, postId: { $in: postIds }, interactionType: 'save' }).lean();
            const likedPostIds = new Set(likes.map(l => l.postId?.toString()).filter(Boolean));
            const savedPostIds = new Set(saves.map(s => s.postId?.toString()).filter(Boolean));
            for (const post of posts) {
                post.isLiked = likedPostIds.has(post._id.toString());
                post.isSaved = savedPostIds.has(post._id.toString());
            }
        }
        const total = await Post_1.default.countDocuments({ author: req.params.id, isDeleted: false, moderationStatus: { $ne: 'removed' } });
        res.json({ posts, hasMore: skip + posts.length < total });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getUserPosts = getUserPosts;
// ─── POST /api/users/:id/follow ────────────────────────────────────────────
const toggleFollow = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.id;
        if (followerId === followingId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }
        const existing = await Follower_1.default.findOne({ follower: followerId, following: followingId });
        let isFollowing = false;
        if (existing) {
            await existing.deleteOne();
            isFollowing = false;
        }
        else {
            await Follower_1.default.create({ follower: followerId, following: followingId });
            await (0, notificationService_1.createNotification)(followingId, 'FOLLOW', followerId);
            isFollowing = true;
        }
        // Enforce counts recalculation from the Follower collection to self-heal drifts
        const followingUserFollowersCount = await Follower_1.default.countDocuments({ following: followingId });
        await User_1.default.findByIdAndUpdate(followingId, { followersCount: followingUserFollowersCount });
        const followerUserFollowingCount = await Follower_1.default.countDocuments({ follower: followerId });
        await User_1.default.findByIdAndUpdate(followerId, { followingCount: followerUserFollowingCount });
        // Broadcast the follow update to all clients in real-time
        (0, socketManager_1.broadcastEvent)('follow:update', {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.toggleFollow = toggleFollow;
// ─── GET /api/users/:id/followers ──────────────────────────────────────────
const getFollowers = async (req, res) => {
    try {
        const followers = await Follower_1.default.find({ following: req.params.id })
            .populate('follower', 'username displayName avatarColor bio followersCount followingCount')
            .lean();
        const followerUsers = followers.map((f) => f.follower).filter(Boolean);
        // Annotate each user with whether the current user is already following them
        if (req.user?.id && followerUsers.length > 0) {
            const currentUserFollows = await Follower_1.default.find({
                follower: req.user.id,
                following: { $in: followerUsers.map((u) => u._id) },
            }).lean();
            const followingSet = new Set(currentUserFollows.map((f) => f.following.toString()));
            for (const u of followerUsers) {
                u.isFollowing = followingSet.has(u._id.toString());
            }
        }
        res.json(followerUsers);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getFollowers = getFollowers;
// ─── GET /api/users/:id/following ──────────────────────────────────────────
const getFollowing = async (req, res) => {
    try {
        const following = await Follower_1.default.find({ follower: req.params.id })
            .populate('following', 'username displayName avatarColor bio followersCount followingCount')
            .lean();
        const followingUsers = following.map((f) => f.following).filter(Boolean);
        // Annotate each user with whether the current user is already following them
        if (req.user?.id && followingUsers.length > 0) {
            const currentUserFollows = await Follower_1.default.find({
                follower: req.user.id,
                following: { $in: followingUsers.map((u) => u._id) },
            }).lean();
            const followingSet = new Set(currentUserFollows.map((f) => f.following.toString()));
            for (const u of followingUsers) {
                u.isFollowing = followingSet.has(u._id.toString());
            }
        }
        res.json(followingUsers);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getFollowing = getFollowing;
// ─── GET /api/users/:id/saved ──────────────────────────────────────────────
const getSavedPosts = async (req, res) => {
    try {
        const userId = req.params.id;
        // Check if the request is for the currently logged in user
        if (req.user?.id !== userId) {
            return res.status(403).json({ message: 'You can only view your own saved posts.' });
        }
        const savedInteractions = await UserInteraction_1.default.find({ userId: new mongoose_1.default.Types.ObjectId(userId), interactionType: 'save' })
            .sort({ createdAt: -1 })
            .lean();
        const postIds = savedInteractions.map(i => i.postId).filter(Boolean);
        const savedPosts = await Post_1.default.find({ _id: { $in: postIds }, isDeleted: false })
            .populate('author', 'username displayName avatarColor')
            .lean();
        // Map to preserve sorting order based on save time
        const sortedPosts = postIds.map(id => savedPosts.find(p => p._id.toString() === id.toString())).filter(Boolean);
        // Populate user-specific interactions
        const currentUserId = req.user?.id;
        if (currentUserId && sortedPosts.length > 0) {
            const sortedPostIds = sortedPosts.map((p) => p?._id).filter(Boolean);
            const likes = await UserInteraction_1.default.find({ userId: currentUserId, postId: { $in: sortedPostIds }, interactionType: 'like' }).lean();
            const saves = await UserInteraction_1.default.find({ userId: currentUserId, postId: { $in: sortedPostIds }, interactionType: 'save' }).lean();
            const likedPostIds = new Set(likes.map(l => l.postId?.toString()).filter(Boolean));
            const savedPostIds = new Set(saves.map(s => s.postId?.toString()).filter(Boolean));
            for (const post of sortedPosts) {
                if (post) {
                    post.isLiked = likedPostIds.has(post._id.toString());
                    post.isSaved = savedPostIds.has(post._id.toString());
                }
            }
        }
        res.json({ posts: sortedPosts });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getSavedPosts = getSavedPosts;
// ─── GET /api/users/search ─────────────────────────────────────────────────
const searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query)
            return res.json([]);
        const regex = new RegExp(query, 'i');
        const users = await User_1.default.find({
            $or: [{ username: regex }, { displayName: regex }],
            isSuspended: false
        })
            .select('username displayName avatarColor bio')
            .limit(10)
            .lean();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.searchUsers = searchUsers;
// ─── PUT /api/users/profile ────────────────────────────────────────────────
const updateProfile = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ message: 'Auth required' });
        const { displayName, bio } = req.body;
        const updatedUser = await User_1.default.findByIdAndUpdate(req.user.id, { displayName, bio }, { new: true, runValidators: true }).select('-passwordHash -loginAttempts -lockUntil').lean();
        res.json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.updateProfile = updateProfile;
// ─── POST /api/users/:id/report ────────────────────────────────────────────
const reportUser = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ message: 'Auth required' });
        const targetId = req.params.id;
        const { reason, contentId, contentType } = req.body;
        if (req.user.id === targetId)
            return res.status(400).json({ message: 'Cannot report yourself' });
        // Ensure they haven't reported this user already for the same content
        const query = { reporter: new mongoose_1.default.Types.ObjectId(req.user.id) };
        if (contentType === 'post') {
            query.reportedPost = new mongoose_1.default.Types.ObjectId(contentId);
        }
        else {
            query.reportedUser = new mongoose_1.default.Types.ObjectId(targetId);
        }
        const existing = await Report_1.default.findOne(query);
        if (existing) {
            return res.status(400).json({ message: 'You have already reported this.' });
        }
        const reportData = {
            reporter: new mongoose_1.default.Types.ObjectId(req.user.id),
            reason: reason || 'Inappropriate behavior',
            status: 'PENDING'
        };
        if (contentType === 'post') {
            reportData.reportedPost = new mongoose_1.default.Types.ObjectId(contentId);
        }
        else {
            reportData.reportedUser = new mongoose_1.default.Types.ObjectId(targetId);
        }
        await Report_1.default.create(reportData);
        // Auto-ban logic
        const distinctReports = await Report_1.default.distinct('reporter', { reportedUser: new mongoose_1.default.Types.ObjectId(targetId) });
        if (distinctReports.length >= 5) {
            await User_1.default.findByIdAndUpdate(targetId, {
                isSuspended: true,
                suspendReason: 'Auto-suspended due to multiple community reports'
            });
        }
        await (0, notificationService_1.createNotification)(targetId, 'REPORT', req.user.id, contentId, reason);
        res.json({ message: 'Report submitted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.reportUser = reportUser;
// ─── DELETE /api/users/profile ──────────────────────────────────────────────
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Auth required' });
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        // 1. Delete user document (Core action)
        await User_1.default.findByIdAndDelete(userObjectId);
        // Run other cleanups safely (so if one model delete fails, it does not abort the whole deletion)
        const cleanups = [
            () => Post_1.default.deleteMany({ author: userObjectId }),
            () => Comment_1.default.deleteMany({ author: userObjectId }),
            () => Follower_1.default.deleteMany({ $or: [{ follower: userObjectId }, { following: userObjectId }] }),
            () => UserInteraction_1.default.deleteMany({ userId: userObjectId }),
            () => Report_1.default.deleteMany({ $or: [{ reporter: userObjectId }, { reportedUser: userObjectId }] }),
            () => RefreshToken_1.default.deleteMany({ userId: userObjectId }),
            () => Message_1.default.deleteMany({ $or: [{ sender: userObjectId }, { receiver: userObjectId }] }),
            () => Notification_1.default.deleteMany({ $or: [{ recipient: userObjectId }, { sender: userObjectId }] })
        ];
        for (const cleanup of cleanups) {
            try {
                await cleanup();
            }
            catch (err) {
                console.error('Secondary cleanup failed during account deletion:', err.message);
            }
        }
        res.json({ message: 'Account permanently deleted' });
    }
    catch (error) {
        console.error('Core user deletion failed:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.deleteAccount = deleteAccount;
