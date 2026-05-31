import mongoose, { Schema } from 'mongoose';

export type SiteContentDocument = {
  key: string;
  title?: string;
  body?: string;
  mediaUrls?: string[];
};

const SiteContentSchema = new Schema<SiteContentDocument>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, default: '', trim: true },
    body: { type: String, default: '', trim: true },
    mediaUrls: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

export const SiteContentModel = mongoose.model<SiteContentDocument>('SiteContent', SiteContentSchema);
