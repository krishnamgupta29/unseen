import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: String,
  type: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text',
  },
  waveform: [Number],
  duration: String,
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
