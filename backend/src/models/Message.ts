import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: string; // hash of sorted user IDs
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  encryptedContent: string; // AES-256 encrypted
  iv: string; // Initialization vector for AES decryption
  messageType: 'text' | 'voice' | 'image';
  isRead: boolean;
  readAt?: Date;
  reactions: { userId: string; emoji: string }[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    conversationId: { type: String, required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    encryptedContent: { type: String, required: true },
    iv: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'voice', 'image'], default: 'text' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    reactions: [
      {
        userId: { type: String },
        emoji: { type: String },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ receiver: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
