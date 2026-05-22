import mongoose, { Schema, Document } from 'mongoose';

export type AbuseEventType =
  | 'failed_login'
  | 'account_locked'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'spam_detected'
  | 'toxicity_flagged'
  | 'bot_detected'
  | 'ip_blocked';

export interface IAbuseLog extends Document {
  userId?: mongoose.Types.ObjectId;
  ipHash: string; // Hashed IP — never store raw IPs
  eventType: AbuseEventType;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  createdAt: Date;
}

const AbuseLogSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    ipHash: { type: String, required: true },
    eventType: {
      type: String,
      enum: ['failed_login', 'account_locked', 'rate_limit_exceeded', 'suspicious_activity', 'spam_detected', 'toxicity_flagged', 'bot_detected', 'ip_blocked'],
      required: true,
    },
    details: { type: String, default: '' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AbuseLogSchema.index({ userId: 1, createdAt: -1 });
AbuseLogSchema.index({ ipHash: 1, createdAt: -1 });
AbuseLogSchema.index({ eventType: 1 });
AbuseLogSchema.index({ severity: 1, resolved: 1 });

export default mongoose.model<IAbuseLog>('AbuseLog', AbuseLogSchema);
