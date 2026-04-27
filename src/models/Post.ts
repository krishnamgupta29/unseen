import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text',
  },
  content: {
    type: String,
    required: true,
  },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  waveform: [Number],
  duration: String,
}, { timestamps: true });

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
