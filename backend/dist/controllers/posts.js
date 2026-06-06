"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPosts = exports.createPost = void 0;
const Post_1 = __importDefault(require("../models/Post"));
const createPost = async (req, res) => {
    try {
        const { content, moodTag, communityId } = req.body;
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const newPost = new Post_1.default({
            author: req.user.id,
            content,
            moodTag,
            community: communityId || undefined,
        });
        await newPost.save();
        const populatedPost = await newPost.populate('author', 'username displayName avatarUrl');
        res.status(201).json(populatedPost);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.createPost = createPost;
const getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const posts = await Post_1.default.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username displayName avatarUrl');
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getPosts = getPosts;
