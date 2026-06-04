import mongoose, { Schema } from 'mongoose';

export type InvestmentDocument = {
  title: string;
  description: string;
  currency: string;
  minimumInvestment: number;
  cargoIds: mongoose.Types.ObjectId[];
  assignedInvestorIds: mongoose.Types.ObjectId[];
  status?: 'active' | 'in_progress' | 'waiting' | 'successful';
  currentStatus?: string;
  hidden?: boolean;
  coverImageUrl?: string;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const InvestmentSchema = new Schema<InvestmentDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    currency: { type: String, required: true, trim: true },
    minimumInvestment: { type: Number, required: true, min: 0 },
    cargoIds: [{ type: Schema.Types.ObjectId, ref: 'Cargo', default: [] }],
    assignedInvestorIds: [{ type: Schema.Types.ObjectId, ref: 'Investor', default: [] }],
    status: { type: String, enum: ['active', 'in_progress', 'waiting', 'successful'], default: 'active' },
    currentStatus: { type: String, default: '', trim: true },
    hidden: { type: Boolean, default: false },
    coverImageUrl: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export const InvestmentModel = mongoose.model<InvestmentDocument>('Investment', InvestmentSchema);
