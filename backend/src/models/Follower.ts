import mongoose, { Schema, Document } from 'mongoose';

export interface IFollower extends Document {
  follower: mongoose.Types.ObjectId;
  following: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FollowerSchema: Schema = new Schema(
  {
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Prevent duplicate follows
FollowerSchema.index({ follower: 1, following: 1 }, { unique: true });

export default mongoose.model<IFollower>('Follower', FollowerSchema);
