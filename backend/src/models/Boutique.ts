import mongoose, { Schema } from 'mongoose';

export type BoutiqueDocument = {
  name: string;
  logoUrl: string;
  description: string;
  location: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const BoutiqueSchema = new Schema<BoutiqueDocument>(
  {
    name: { type: String, required: true, trim: true },
    logoUrl: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const BoutiqueModel = mongoose.model<BoutiqueDocument>('Boutique', BoutiqueSchema);
