import mongoose, { Schema } from 'mongoose';

export type SocialLink = {
  platform: string;
  label: string;
  url: string;
};

export type SiteContentDocument = {
  key: string;
  title?: string;
  body?: string;
  mediaUrls?: string[];
  links?: SocialLink[];
};

const SocialLinkSchema = new Schema<SocialLink>(
  {
    platform: { type: String, required: true, trim: true },
    label: { type: String, default: '', trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const SiteContentSchema = new Schema<SiteContentDocument>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, default: '', trim: true },
    body: { type: String, default: '', trim: true },
    mediaUrls: [{ type: String, trim: true }],
    links: { type: [SocialLinkSchema], default: [] },
  },
  { timestamps: true }
);

export const SiteContentModel = mongoose.model<SiteContentDocument>('SiteContent', SiteContentSchema);
