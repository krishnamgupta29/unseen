import mongoose, { Schema, Document } from 'mongoose';

// Tracks every meaningful user interaction for the feed algorithm
export interface IUserInteraction extends Document {
  userId: mongoose.Types.ObjectId;
  postId?: mongoose.Types.ObjectId;
  commentId?: mongoose.Types.ObjectId;
  authorId?: mongoose.Types.ObjectId;
  interactionType: 'like' | 'comment' | 'save' | 'view' | 'share' | 'read' | 'like_comment';
  moodTag?: string;
  hashtags: string[];
  readDurationMs: number; // How long they read the post
  createdAt: Date;
}

const UserInteractionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    commentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    interactionType: {
      type: String,
      enum: ['like', 'comment', 'save', 'view', 'share', 'read', 'like_comment'],
      required: true,
    },
    moodTag: { type: String },
    hashtags: [{ type: String }],
    readDurationMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserInteractionSchema.index({ userId: 1, createdAt: -1 });
UserInteractionSchema.index({ userId: 1, moodTag: 1 });
UserInteractionSchema.index({ userId: 1, authorId: 1 });
UserInteractionSchema.index({ postId: 1 });
UserInteractionSchema.index({ commentId: 1 });

export default mongoose.model<IUserInteraction>('UserInteraction', UserInteractionSchema);
