import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'REPOST' | 'SYSTEM' | 'REPORT';
  post?: mongoose.Types.ObjectId;
  reason?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['LIKE', 'COMMENT', 'FOLLOW', 'REPOST', 'SYSTEM', 'REPORT'], required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post' },
    reason: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
