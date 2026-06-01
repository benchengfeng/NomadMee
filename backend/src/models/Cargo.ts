import mongoose, { Schema } from 'mongoose';

export type CargoDocument = {
  productBeingShipped: string;
  quantity: number;
  purchaseLocation: string;
  purchasePrice: number;
  currency: string;
  shippingDestination: string;
  shippingPrice: number;
  otherExpenses: number;
  estimatedTimeOfArrival: Date;
  estimatedTimeOfSelling: Date;
  assignedInvestorIds: mongoose.Types.ObjectId[];
  shippingType?: 'sea' | 'air' | 'land';
  cargoDescription?: string;
  story?: { text?: string; mediaUrls?: string[] };
  hidden?: boolean;
  coverImageUrl?: string;
  purchaseDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

const CargoSchema = new Schema<CargoDocument>(
  {
    productBeingShipped: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    purchaseLocation: { type: String, required: true, trim: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    shippingDestination: { type: String, required: true, trim: true },
    shippingPrice: { type: Number, required: true, min: 0 },
    otherExpenses: { type: Number, required: true, min: 0 },
    estimatedTimeOfArrival: { type: Date, required: true },
    estimatedTimeOfSelling: { type: Date, required: true },
    assignedInvestorIds: [{ type: Schema.Types.ObjectId, ref: 'Investor', default: [] }],
    shippingType: { type: String, enum: ['sea', 'air', 'land'], default: 'sea' },
    cargoDescription: { type: String, default: '', trim: true },
    hidden: { type: Boolean, default: false },
    coverImageUrl: { type: String, default: '', trim: true },
    purchaseDate: { type: Date },
    story: {
      text: { type: String, default: '', trim: true },
      mediaUrls: [{ type: String, trim: true }],
    },
  },
  { timestamps: true }
);

export const CargoModel = mongoose.model<CargoDocument>('Cargo', CargoSchema);
