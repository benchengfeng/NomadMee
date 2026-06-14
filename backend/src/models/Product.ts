import mongoose, { Schema } from 'mongoose';

export type ProductVariant = {
  label: string;
  price: number;
};

export type PriceMatrixOption = {
  label: string;
  price: number;
  currency: string;
};

export type PriceMatrixRow = {
  label: string;
  options: PriceMatrixOption[];
};

export type ProductSection = 'food' | 'artisanal';

export type ProductDocument = {
  name: string;
  description: string;
  origin: string;
  originStory: string;
  price: number;
  currency: string;
  variants: ProductVariant[];
  priceMatrix: PriceMatrixRow[];
  customOrderAvailable: boolean;
  customOrderNote: string;
  stock: number;
  coverImageUrl: string;
  images: string[];
  section: ProductSection;
  category: string;
  active: boolean;
  boutiqueId?: string;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
};

const VariantSchema = new Schema<ProductVariant>(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PriceMatrixOptionSchema = new Schema<PriceMatrixOption>(
  {
    label:    { type: String, required: true, trim: true },
    price:    { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, default: 'USD' },
  },
  { _id: false }
);

const PriceMatrixRowSchema = new Schema<PriceMatrixRow>(
  {
    label:   { type: String, required: true, trim: true },
    options: { type: [PriceMatrixOptionSchema], default: [] },
  },
  { _id: false }
);

const ProductSchema = new Schema<ProductDocument>(
  {
    name:                 { type: String, required: true, trim: true },
    description:          { type: String, default: '', trim: true },
    origin:               { type: String, default: '', trim: true },
    originStory:          { type: String, default: '', trim: true },
    price:                { type: Number, required: true, min: 0 },
    currency:             { type: String, required: true, trim: true, default: 'USD' },
    variants:             { type: [VariantSchema], default: [] },
    priceMatrix:          { type: [PriceMatrixRowSchema], default: [] },
    customOrderAvailable: { type: Boolean, default: false },
    customOrderNote:      { type: String, default: '', trim: true },
    stock:                { type: Number, default: 0, min: 0 },
    coverImageUrl:        { type: String, default: '', trim: true },
    images:               [{ type: String, trim: true }],
    section:              { type: String, enum: ['food', 'artisanal'], default: 'food' },
    category:             { type: String, default: '', trim: true },
    active:               { type: Boolean, default: true },
    boutiqueId:           { type: String, trim: true },
    position:             { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ProductModel = mongoose.model<ProductDocument>('Product', ProductSchema);
