import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
  },
  email: {
    type: String,
    sparse: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  displayName: String,
  bio: String,
  avatarGradient: {
    type: String,
    default: 'from-violet-600 via-purple-600 to-indigo-600',
  },
  postsCount: { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  highlights: [String],
  moodTag: String,
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
