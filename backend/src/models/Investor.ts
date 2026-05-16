import mongoose, { Schema } from 'mongoose';

export type InvestorDocument = {
  name: string;
  username: string;
  password: string;
  investmentAmount: number;
  profitPercentageOnInvestment: number;
  estimatedROI: number;
  assignedCargoIds: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};

const InvestorSchema = new Schema<InvestorDocument>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    investmentAmount: { type: Number, required: true, min: 0 },
    profitPercentageOnInvestment: { type: Number, required: true, min: 0 },
    estimatedROI: { type: Number, required: true, min: 0 },
    assignedCargoIds: [{ type: Schema.Types.ObjectId, ref: 'Cargo', default: [] }],
  },
  { timestamps: true }
);

export const InvestorModel = mongoose.model<InvestorDocument>('Investor', InvestorSchema);
