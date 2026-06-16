import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  displayName: string;
  username: string;
  email?: string;
  passwordHash: string;
  bio?: string;
  avatarColor: string;
  role: 'user' | 'admin' | 'moderator';
  // Security
  loginAttempts: number;
  lockUntil?: Date;
  isActive: boolean;
  isSuspended: boolean;
  suspendReason?: string;
  trustScore: number; // 0-100, starts at 70
  // Privacy
  emailVerified: boolean;
  // Social
  followersCount: number;
  followingCount: number;
  savedPosts: mongoose.Types.ObjectId[];
  // Feed personalization
  interestTags: string[];
  // Reset password OTP fields
  resetPasswordOtp?: string;
  resetPasswordOtpExpires?: Date;
  lastOtpSentAt?: Date;
  failedOtpAttempts?: number;
  currentSessionId?: string | null;
  // Timestamps
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
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
    savedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    // Feed personalization
    interestTags: [{ type: String }],
    lastSeenAt: { type: Date, default: Date.now },
    currentSessionId: { type: String, default: null },
  },
  { timestamps: true }
);

// Indexes for performance
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ displayName: 1 });
UserSchema.index({ trustScore: -1 });
UserSchema.index({ createdAt: -1 });

export default mongoose.model<IUser>('User', UserSchema);
