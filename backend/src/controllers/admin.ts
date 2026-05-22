import { Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import AbuseLog from '../models/AbuseLog';
import Report from '../models/Report';
import { AuthRequest } from '../middlewares/auth';

// GET /api/admin/stats
export const getStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalPosts, flaggedPosts, abuseLogs, suspendedUsers] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ isDeleted: false }),
      Post.countDocuments({ isFlagged: true, moderationStatus: 'review' }),
      AbuseLog.countDocuments({ resolved: false }),
      User.countDocuments({ isSuspended: true }),
    ]);
    const oneDayAgo = new Date(Date.now() - 86400000);
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const postsToday = await Post.countDocuments({ createdAt: { $gte: oneDayAgo } });
    res.json({ totalUsers, totalPosts, flaggedPosts, abuseLogs, suspendedUsers, newUsersToday, postsToday });
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

// GET /api/admin/flagged-posts
export const getFlaggedPosts = async (_req: AuthRequest, res: Response) => {
  try {
    const posts = await Post.find({ isFlagged: true, moderationStatus: 'review', isDeleted: false })
      .populate('author', 'username displayName')
      .sort({ toxicityScore: -1 })
      .limit(50);
    res.json(posts);
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

// POST /api/admin/posts/:id/remove
export const removePost = async (req: AuthRequest, res: Response) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { isDeleted: true, moderationStatus: 'removed' });
    res.json({ message: 'Post removed.' });
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

// POST /api/admin/posts/:id/clear
export const clearPost = async (req: AuthRequest, res: Response) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { isFlagged: false, moderationStatus: 'clear' });
    res.json({ message: 'Post cleared.' });
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

// POST /api/admin/users/:id/suspend
export const suspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    await User.findByIdAndUpdate(req.params.id, { isSuspended: true, suspendReason: reason || 'Policy violation.' });
    res.json({ message: 'User suspended.' });
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

// POST /api/admin/users/:id/unsuspend
export const unsuspendUser = async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isSuspended: false, suspendReason: undefined });
    res.json({ message: 'User unsuspended.' });
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

// GET /api/admin/abuse-logs
export const getAbuseLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { severity, resolved } = req.query;
    const filter: any = {};
    if (severity) filter.severity = severity;
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    const logs = await AbuseLog.find(filter)
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

// POST /api/admin/abuse-logs/:id/resolve
export const resolveAbuseLog = async (req: AuthRequest, res: Response) => {
  try {
    await AbuseLog.findByIdAndUpdate(req.params.id, { resolved: true });
    res.json({ message: 'Resolved.' });
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};

// GET /api/admin/users
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, search } = req.query;
    const skip = (Number(page) - 1) * 30;
    const filter: any = {};
    if (search) filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
    ];
    const users = await User.find(filter)
      .select('-passwordHash -loginAttempts -lockUntil')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(30);
    const total = await User.countDocuments(filter);
    res.json({ users, total, page: Number(page) });
  } catch (e: any) { res.status(500).json({ message: 'Server error', error: e.message }); }
};
