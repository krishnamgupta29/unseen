"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.toggleLikeComment = exports.createComment = exports.getComments = void 0;
const Comment_1 = __importDefault(require("../models/Comment"));
const Post_1 = __importDefault(require("../models/Post"));
const UserInteraction_1 = __importDefault(require("../models/UserInteraction"));
const mongoose_1 = __importDefault(require("mongoose"));
const notificationService_1 = require("../services/notificationService");
const socketManager_1 = require("../services/socketManager");
const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await Comment_1.default.find({ post: new mongoose_1.default.Types.ObjectId(postId), isDeleted: false })
            .populate('author', 'username displayName avatarColor')
            .sort({ createdAt: -1 })
            .lean();
        // Check if the current user has liked any of these comments
        let commentsWithLikes = comments;
        if (req.user?.id) {
            const commentIds = comments.map(c => c._id);
            const likes = await UserInteraction_1.default.find({
                userId: new mongoose_1.default.Types.ObjectId(req.user.id),
                commentId: { $in: commentIds },
                interactionType: 'like_comment'
            }).lean();
            const likedCommentIds = new Set(likes.map(l => l.commentId?.toString()));
            commentsWithLikes = comments.map(c => ({
                ...c,
                isLiked: likedCommentIds.has(c._id.toString())
            }));
        }
        res.json(commentsWithLikes);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getComments = getComments;
const createComment = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ message: 'Auth required' });
        const { postId } = req.params;
        const { content, parentComment } = req.body;
        if (!content)
            return res.status(400).json({ message: 'Content is required' });
        const post = await Post_1.default.findById(postId);
        if (!post)
            return res.status(404).json({ message: 'Post not found' });
        const comment = await Comment_1.default.create({
            author: new mongoose_1.default.Types.ObjectId(req.user.id),
            post: new mongoose_1.default.Types.ObjectId(postId),
            parentComment: parentComment ? new mongoose_1.default.Types.ObjectId(parentComment) : undefined,
            content
        });
        await Post_1.default.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
        // Send notifications
        if (parentComment) {
            const parent = await Comment_1.default.findById(parentComment);
            if (parent && parent.author) {
                await (0, notificationService_1.createNotification)(parent.author.toString(), 'COMMENT', req.user.id, postId);
            }
        }
        else {
            if (post && post.author) {
                await (0, notificationService_1.createNotification)(post.author.toString(), 'COMMENT', req.user.id, postId);
            }
        }
        // Fetch author details to return with comment
        await comment.populate('author', 'username displayName avatarColor');
        // Broadcast comment creation event via sockets
        (0, socketManager_1.broadcastEvent)('comment:created', { postId, comment });
        // Return the new comment
        res.json(comment);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.createComment = createComment;
const toggleLikeComment = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ message: 'Auth required' });
        const { commentId } = req.params;
        const existing = await UserInteraction_1.default.findOne({
            userId: new mongoose_1.default.Types.ObjectId(req.user.id),
            commentId: new mongoose_1.default.Types.ObjectId(commentId),
            interactionType: 'like_comment'
        });
        if (existing) {
            await existing.deleteOne();
            await Comment_1.default.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } });
            res.json({ message: 'Unliked', isLiked: false });
        }
        else {
            await UserInteraction_1.default.create({
                userId: new mongoose_1.default.Types.ObjectId(req.user.id),
                commentId: new mongoose_1.default.Types.ObjectId(commentId),
                interactionType: 'like_comment'
            });
            await Comment_1.default.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } });
            res.json({ message: 'Liked', isLiked: true });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.toggleLikeComment = toggleLikeComment;
const deleteComment = async (req, res) => {
    try {
        if (!req.user?.id)
            return res.status(401).json({ message: 'Auth required' });
        const { commentId } = req.params;
        const comment = await Comment_1.default.findById(commentId);
        if (!comment)
            return res.status(404).json({ message: 'Comment not found' });
        // Verify ownership
        if (comment.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }
        // Recursive helper to mark comment and all descendants as deleted
        const deleteRecursive = async (id) => {
            const target = await Comment_1.default.findByIdAndUpdate(id, { isDeleted: true });
            if (!target)
                return 0;
            let count = 1;
            const replies = await Comment_1.default.find({ parentComment: new mongoose_1.default.Types.ObjectId(id), isDeleted: false });
            for (const reply of replies) {
                count += await deleteRecursive(reply._id.toString());
            }
            return count;
        };
        const deletedCount = await deleteRecursive(commentId);
        // Decrement post comments count
        await Post_1.default.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -deletedCount } });
        // Broadcast comment deleted event via sockets
        (0, socketManager_1.broadcastEvent)('comment:deleted', { postId: comment.post.toString(), commentId, deletedCount });
        res.json({ message: 'Comment deleted successfully', deletedCount });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.deleteComment = deleteComment;
