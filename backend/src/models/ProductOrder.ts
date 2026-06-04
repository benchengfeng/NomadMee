import mongoose, { Schema } from 'mongoose';

export type ProductOrderDocument = {
  productId: string;
  productName: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  total: number;
  fullName: string;
  email: string;
  country: string;
  message?: string;
  status: 'new' | 'read' | 'contacted';
  createdAt?: Date;
  updatedAt?: Date;
};

const ProductOrderSchema = new Schema<ProductOrderDocument>(
  {
    productId: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    variant: { type: String, default: '', trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true },
    total: { type: Number, required: true, min: 0 },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    message: { type: String, default: '', trim: true },
    status: { type: String, enum: ['new', 'read', 'contacted'], default: 'new' },
  },
  { timestamps: true }
);

export const ProductOrderModel = mongoose.model<ProductOrderDocument>('ProductOrder', ProductOrderSchema);
