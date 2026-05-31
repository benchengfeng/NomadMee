import mongoose, { Schema } from 'mongoose';

export type InvestorDocument = {
  name: string;
  displayName?: string;
  avatar?: string;
  username: string;
  password: string;
  investmentAmount: number;
  profitPercentageOnInvestment: number;
  estimatedROI: number;
  currency: string;
  location?: string;
  kycCompleted: boolean;
  assignedCargoIds: mongoose.Types.ObjectId[];
  assignedInvestmentIds: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};

const InvestorSchema = new Schema<InvestorDocument>(
  {
    name: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true },
    avatar: { type: String, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    investmentAmount: { type: Number, required: true, min: 0 },
    profitPercentageOnInvestment: { type: Number, required: true, min: 0 },
    estimatedROI: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    kycCompleted: { type: Boolean, default: false },
    assignedCargoIds: [{ type: Schema.Types.ObjectId, ref: 'Cargo', default: [] }],
    assignedInvestmentIds: [{ type: Schema.Types.ObjectId, ref: 'Investment', default: [] }],
  },
  { timestamps: true }
);

export const InvestorModel = mongoose.model<InvestorDocument>('Investor', InvestorSchema);
