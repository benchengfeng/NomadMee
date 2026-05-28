import mongoose, { Schema } from 'mongoose';

export type InvestmentDocument = {
  title: string;
  description: string;
  currency: string;
  minimumInvestment: number;
  cargoIds: mongoose.Types.ObjectId[];
  assignedInvestorIds: mongoose.Types.ObjectId[];
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
  },
  { timestamps: true }
);

export const InvestmentModel = mongoose.model<InvestmentDocument>('Investment', InvestmentSchema);
