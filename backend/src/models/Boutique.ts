import mongoose, { Schema } from 'mongoose';

export type BoutiqueSocialLinks = {
  instagram?: string;
  website?: string;
};

export type BoutiqueDocument = {
  name: string;
  tagline: string;
  bio: string;
  originStory: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  coverImageUrl: string;
  profileImageUrl: string;
  logoUrl: string;
  galleryUrls: string[];
  category: string;
  section: 'earth' | 'hands';
  accentColor: string;
  active: boolean;
  linkedJourneyIds: string[];
  socialLinks: BoutiqueSocialLinks;
  createdAt?: Date;
  updatedAt?: Date;
};

const SocialLinksSchema = new Schema<BoutiqueSocialLinks>(
  { instagram: String, website: String },
  { _id: false }
);

const BoutiqueSchema = new Schema<BoutiqueDocument>(
  {
    name:            { type: String, required: true, trim: true },
    tagline:         { type: String, default: '', trim: true },
    bio:             { type: String, default: '', trim: true },
    originStory:     { type: String, default: '', trim: true },
    location:        { type: String, default: '', trim: true },
    locationLat:     { type: Number },
    locationLng:     { type: Number },
    coverImageUrl:   { type: String, default: '', trim: true },
    profileImageUrl: { type: String, default: '', trim: true },
    logoUrl:         { type: String, default: '', trim: true },
    galleryUrls:     [{ type: String, trim: true }],
    category:        { type: String, default: '', trim: true },
    section:         { type: String, enum: ['earth', 'hands'], default: 'earth' },
    accentColor:     { type: String, default: '', trim: true },
    active:          { type: Boolean, default: true },
    linkedJourneyIds:{ type: [String], default: [] },
    socialLinks:     { type: SocialLinksSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const BoutiqueModel = mongoose.model<BoutiqueDocument>('Boutique', BoutiqueSchema);
