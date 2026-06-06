"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const PostSchema = new mongoose_1.Schema({
    author: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 500 },
    moodTag: { type: String, trim: true, maxlength: 30 },
    hashtags: [{ type: String, lowercase: true }],
    community: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Community' },
    // Engagement
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    repostsCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    // Feed scoring
    engagementScore: { type: Number, default: 0 },
    freshnessScore: { type: Number, default: 100 },
    feedScore: { type: Number, default: 0 },
    // Moderation
    isDeleted: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String },
    toxicityScore: { type: Number, default: 0, min: 0, max: 1 },
    moderationStatus: { type: String, enum: ['clear', 'review', 'removed'], default: 'clear' },
}, { timestamps: true });
// Indexes for fast feed queries
PostSchema.index({ feedScore: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ moodTag: 1 });
PostSchema.index({ moderationStatus: 1, isDeleted: 1 });
exports.default = mongoose_1.default.model('Post', PostSchema);
