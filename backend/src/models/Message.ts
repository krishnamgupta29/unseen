/**
 * ARCHITECTURE NOTICE — SERVER-SIDE ENCRYPTION AT REST (NOT E2EE):
 * Direct messages in UNSEEN are encrypted at rest in MongoDB Atlas using AES-256-GCM.
 * Note: This is SERVER-SIDE encryption at rest — the backend server holds the encryption
 * key (`ENCRYPTION_SECRET`) and decrypts message content for authorized clients during API
 * requests and real-time Socket.io communication.
 * This is NOT End-to-End Encryption (E2EE) where only clients possess decryption keys.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { encrypt, decrypt } from '../services/encryption';

export interface IMessage extends Document {
  conversationId: string; // hash of sorted user IDs
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  encryptedContent: string; // AES-256 encrypted ciphertext
  iv: string; // Initialization vector for AES decryption
  tag?: string; // AES-256-GCM authentication tag
  text?: string; // Virtual/transient plaintext input field for pre-save hook
  messageType: 'text' | 'voice' | 'image';
  isRead: boolean;
  readAt?: Date;
  reactions: { userId: string; emoji: string }[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  getDecryptedContent(): string;
}

const MessageSchema: Schema = new Schema(
  {
    conversationId: { type: String, required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    encryptedContent: { type: String, required: true },
    iv: { type: String, required: true },
    tag: { type: String },
    text: { type: String }, // Transient plaintext field auto-encrypted on save
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

// ── Mongoose Pre-Save Hook: Auto-encrypt plaintext 'text' field before save ──
MessageSchema.pre('save', function (this: IMessage, next: any) {
  if (this.text && this.text.trim()) {
    const { encryptedContent, iv, tag } = encrypt(this.text.trim());
    this.encryptedContent = encryptedContent;
    this.iv = iv;
    this.tag = tag;
    this.text = undefined; // Remove plaintext so it's never stored in MongoDB
  }
  if (typeof next === 'function') {
    next();
  }
});

// ── Instance Method: Decrypt message content ───────────────────────────────
MessageSchema.methods.getDecryptedContent = function (): string {
  return decrypt(this.encryptedContent, this.iv, this.tag);
};

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ receiver: 1 });
MessageSchema.index({ receiver: 1, readAt: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
