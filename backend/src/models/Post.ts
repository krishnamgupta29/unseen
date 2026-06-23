import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  moodTag?: string;
  hashtags: string[];
  community?: mongoose.Types.ObjectId;
  // Engagement
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  savesCount: number;
  viewsCount: number;
  // Feed scoring
  engagementScore: number;
  freshnessScore: number;
  feedScore: number;
  // Moderation
  isDeleted: boolean;
  isFlagged: boolean;
  flagReason?: string;
  toxicityScore: number; // 0.0 - 1.0
  moderationStatus: 'clear' | 'review' | 'removed';
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    moodTag: { type: String, trim: true, lowercase: true, maxlength: 30 },
    hashtags: [{ type: String, lowercase: true }],
    community: { type: Schema.Types.ObjectId, ref: 'Community' },
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
  },
  { timestamps: true }
);

// Indexes for fast feed queries
PostSchema.index({ feedScore: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ moodTag: 1 });
PostSchema.index({ moderationStatus: 1, isDeleted: 1 });
PostSchema.index({ isDeleted: 1, moderationStatus: 1, createdAt: -1 });

export default mongoose.model<IPost>('Post', PostSchema);
