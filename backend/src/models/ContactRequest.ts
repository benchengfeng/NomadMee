import mongoose, { Schema } from 'mongoose';

export type ContactRequestDocument = {
  investmentId: string;
  investmentTitle: string;
  fullName: string;
  contactMethod: 'whatsapp' | 'email';
  contactDetail: string;
  rdvDate: string;
  note?: string;
  status: 'new' | 'read' | 'contacted';
  createdAt?: Date;
  updatedAt?: Date;
};

const ContactRequestSchema = new Schema<ContactRequestDocument>(
  {
    investmentId: { type: String, required: true, trim: true },
    investmentTitle: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    contactMethod: { type: String, enum: ['whatsapp', 'email'], required: true },
    contactDetail: { type: String, required: true, trim: true },
    rdvDate: { type: String, required: true, trim: true },
    note: { type: String, default: '', trim: true },
    status: { type: String, enum: ['new', 'read', 'contacted'], default: 'new' },
  },
  { timestamps: true }
);

export const ContactRequestModel = mongoose.model<ContactRequestDocument>('ContactRequest', ContactRequestSchema);
