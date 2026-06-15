import mongoose, { Schema } from 'mongoose';

export type InvestorDocument = {
  name: string;
  displayName?: string;
  avatar?: string;
  username: string;
  password?: string;
  email?: string;
  emailVerified: boolean;
  googleId?: string;
  registrationMethod: 'manual' | 'email' | 'google';
  accountStatus: 'pending_verification' | 'active' | 'suspended';
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  investmentAmount?: number;
  profitPercentageOnInvestment?: number;
  estimatedROI?: number;
  currency?: string;
  location?: string;
  preferredCurrency?: string;
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
    password: { type: String },
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    emailVerified: { type: Boolean, default: false },
    googleId: { type: String, unique: true, sparse: true, trim: true },
    registrationMethod: { type: String, enum: ['manual', 'email', 'google'], default: 'manual' },
    accountStatus: { type: String, enum: ['pending_verification', 'active', 'suspended'], default: 'active' },
    passwordResetToken: { type: String },
    passwordResetExpiry: { type: Date },
    investmentAmount: { type: Number, min: 0 },
    profitPercentageOnInvestment: { type: Number, min: 0 },
    estimatedROI: { type: Number, min: 0 },
    currency: { type: String, trim: true },
    location: { type: String, trim: true },
    preferredCurrency: { type: String, trim: true },
    kycCompleted: { type: Boolean, default: false },
    assignedCargoIds: [{ type: Schema.Types.ObjectId, ref: 'Cargo', default: [] }],
    assignedInvestmentIds: [{ type: Schema.Types.ObjectId, ref: 'Investment', default: [] }],
  },
  { timestamps: true }
);

export const InvestorModel = mongoose.model<InvestorDocument>('Investor', InvestorSchema);
