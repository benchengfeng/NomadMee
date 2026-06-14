import mongoose, { Schema } from 'mongoose';

export type PartnerDocument = {
  name: string;
  logoUrl: string;
  title: string;
  description: string;
  active: boolean;
  location?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const PartnerSchema = new Schema<PartnerDocument>(
  {
    name: { type: String, required: true, trim: true },
    logoUrl: { type: String, default: '', trim: true },
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    active: { type: Boolean, default: true },
    location: { type: String, default: '', trim: true },
    locationLat: { type: Number, default: null },
    locationLng: { type: Number, default: null },
  },
  { timestamps: true }
);

export const PartnerModel = mongoose.model<PartnerDocument>('Partner', PartnerSchema);
