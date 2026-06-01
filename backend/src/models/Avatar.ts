import mongoose, { Schema } from 'mongoose';

export type AvatarDocument = {
  name: string;
  imageUrl: string;
  defaultTheme: number; // 0–3 index into dashboardThemes
  secret: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const AvatarSchema = new Schema<AvatarDocument>(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    defaultTheme: { type: Number, default: 0, min: 0, max: 3 },
    secret: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AvatarModel = mongoose.model<AvatarDocument>('Avatar', AvatarSchema);
