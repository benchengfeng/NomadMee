import mongoose, { Schema } from 'mongoose';

export type SessionDocument = {
  token: string;
  userId: string;
  role: 'admin' | 'investor';
  expiresAt: Date;
  createdAt?: Date;
};

const SessionSchema = new Schema<SessionDocument>(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true },
    role: { type: String, enum: ['admin', 'investor'], required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// MongoDB auto-deletes documents once expiresAt is in the past
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = mongoose.model<SessionDocument>('Session', SessionSchema);
