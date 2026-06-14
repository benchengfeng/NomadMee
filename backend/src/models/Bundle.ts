import mongoose, { Schema } from 'mongoose';

export type BundleDocument = {
  name: string;
  imageUrl: string;
  description: string;
  price: number;
  currency: string;
  productIds: string[];
  section: 'food' | 'artisanal';
  boutiqueId?: string;
  active: boolean;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
};

const BundleSchema = new Schema<BundleDocument>(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, default: 'EUR' },
    productIds: [{ type: String, trim: true }],
    section:    { type: String, enum: ['food', 'artisanal'], default: 'food' },
    boutiqueId: { type: String, trim: true },
    active:     { type: Boolean, default: true },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const BundleModel = mongoose.model<BundleDocument>('Bundle', BundleSchema);
