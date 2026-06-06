"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.resolveAbuseLog = exports.getAbuseLogs = exports.unsuspendUser = exports.suspendUser = exports.clearPost = exports.removePost = exports.getFlaggedPosts = exports.getStats = void 0;
const User_1 = __importDefault(require("../models/User"));
const Post_1 = __importDefault(require("../models/Post"));
const AbuseLog_1 = __importDefault(require("../models/AbuseLog"));
// GET /api/admin/stats
const getStats = async (_req, res) => {
    try {
        const [totalUsers, totalPosts, flaggedPosts, abuseLogs, suspendedUsers] = await Promise.all([
            User_1.default.countDocuments(),
            Post_1.default.countDocuments({ isDeleted: false }),
            Post_1.default.countDocuments({ isFlagged: true, moderationStatus: 'review' }),
            AbuseLog_1.default.countDocuments({ resolved: false }),
            User_1.default.countDocuments({ isSuspended: true }),
        ]);
        const oneDayAgo = new Date(Date.now() - 86400000);
        const newUsersToday = await User_1.default.countDocuments({ createdAt: { $gte: oneDayAgo } });
        const postsToday = await Post_1.default.countDocuments({ createdAt: { $gte: oneDayAgo } });
        res.json({ totalUsers, totalPosts, flaggedPosts, abuseLogs, suspendedUsers, newUsersToday, postsToday });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.getStats = getStats;
// GET /api/admin/flagged-posts
const getFlaggedPosts = async (_req, res) => {
    try {
        const posts = await Post_1.default.find({ isFlagged: true, moderationStatus: 'review', isDeleted: false })
            .populate('author', 'username displayName')
            .sort({ toxicityScore: -1 })
            .limit(50);
        res.json(posts);
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.getFlaggedPosts = getFlaggedPosts;
// POST /api/admin/posts/:id/remove
const removePost = async (req, res) => {
    try {
        await Post_1.default.findByIdAndUpdate(req.params.id, { isDeleted: true, moderationStatus: 'removed' });
        res.json({ message: 'Post removed.' });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.removePost = removePost;
// POST /api/admin/posts/:id/clear
const clearPost = async (req, res) => {
    try {
        await Post_1.default.findByIdAndUpdate(req.params.id, { isFlagged: false, moderationStatus: 'clear' });
        res.json({ message: 'Post cleared.' });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.clearPost = clearPost;
// POST /api/admin/users/:id/suspend
const suspendUser = async (req, res) => {
    try {
        const { reason } = req.body;
        await User_1.default.findByIdAndUpdate(req.params.id, { isSuspended: true, suspendReason: reason || 'Policy violation.' });
        res.json({ message: 'User suspended.' });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.suspendUser = suspendUser;
// POST /api/admin/users/:id/unsuspend
const unsuspendUser = async (req, res) => {
    try {
        await User_1.default.findByIdAndUpdate(req.params.id, { isSuspended: false, suspendReason: undefined });
        res.json({ message: 'User unsuspended.' });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.unsuspendUser = unsuspendUser;
// GET /api/admin/abuse-logs
const getAbuseLogs = async (req, res) => {
    try {
        const { severity, resolved } = req.query;
        const filter = {};
        if (severity)
            filter.severity = severity;
        if (resolved !== undefined)
            filter.resolved = resolved === 'true';
        const logs = await AbuseLog_1.default.find(filter)
            .populate('userId', 'username')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.getAbuseLogs = getAbuseLogs;
// POST /api/admin/abuse-logs/:id/resolve
const resolveAbuseLog = async (req, res) => {
    try {
        await AbuseLog_1.default.findByIdAndUpdate(req.params.id, { resolved: true });
        res.json({ message: 'Resolved.' });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.resolveAbuseLog = resolveAbuseLog;
// GET /api/admin/users
const getUsers = async (req, res) => {
    try {
        const { page = 1, search } = req.query;
        const skip = (Number(page) - 1) * 30;
        const filter = {};
        if (search)
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { displayName: { $regex: search, $options: 'i' } },
            ];
        const users = await User_1.default.find(filter)
            .select('-passwordHash -loginAttempts -lockUntil')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(30);
        const total = await User_1.default.countDocuments(filter);
        res.json({ users, total, page: Number(page) });
    }
    catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};
exports.getUsers = getUsers;
