import mongoose, { Schema } from 'mongoose';

export type ContactRequestDocument = {
  type: 'investment' | 'contact_us';
  investmentId?: string;
  investmentTitle?: string;
  fullName: string;
  contactMethod: 'whatsapp' | 'email';
  contactDetail: string;
  rdvDate?: string;
  note?: string;
  status: 'new' | 'read' | 'contacted';
  createdAt?: Date;
  updatedAt?: Date;
};

const ContactRequestSchema = new Schema<ContactRequestDocument>(
  {
    type: { type: String, enum: ['investment', 'contact_us'], default: 'investment' },
    investmentId: { type: String, trim: true },
    investmentTitle: { type: String, trim: true },
    fullName: { type: String, required: true, trim: true },
    contactMethod: { type: String, enum: ['whatsapp', 'email'], required: true },
    contactDetail: { type: String, required: true, trim: true },
    rdvDate: { type: String, trim: true },
    note: { type: String, default: '', trim: true },
    status: { type: String, enum: ['new', 'read', 'contacted'], default: 'new' },
  },
  { timestamps: true }
);

export const ContactRequestModel = mongoose.model<ContactRequestDocument>('ContactRequest', ContactRequestSchema);
