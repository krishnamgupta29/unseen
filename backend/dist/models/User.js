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
const UserSchema = new mongoose_1.Schema({
    displayName: { type: String, required: true, trim: true, maxlength: 50 },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, sparse: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    bio: { type: String, default: '', maxlength: 300 },
    avatarColor: { type: String, default: 'from-violet-500 to-purple-900' },
    role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
    // Security fields
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspendReason: { type: String },
    trustScore: { type: Number, default: 70, min: 0, max: 100 },
    // Reset password OTP fields
    resetPasswordOtp: { type: String },
    resetPasswordOtpExpires: { type: Date },
    lastOtpSentAt: { type: Date },
    failedOtpAttempts: { type: Number, default: 0 },
    // Privacy
    emailVerified: { type: Boolean, default: false },
    // Social
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    savedPosts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Post' }],
    // Feed personalization
    interestTags: [{ type: String }],
    lastSeenAt: { type: Date, default: Date.now },
}, { timestamps: true });
// Indexes for performance
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ displayName: 1 });
UserSchema.index({ trustScore: -1 });
UserSchema.index({ createdAt: -1 });
exports.default = mongoose_1.default.model('User', UserSchema);
