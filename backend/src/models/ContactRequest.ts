import mongoose, { Schema } from 'mongoose';

export type ContactRequestDocument = {
  type: 'investment' | 'contact_us' | 'journey_interest';
  investmentId?: string;
  investmentTitle?: string;
  journeyId?: string;
  journeyTitle?: string;
  preferredDuration?: string;
  preferredDates?: string;
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
    type: { type: String, enum: ['investment', 'contact_us', 'journey_interest'], default: 'investment' },
    investmentId: { type: String, trim: true },
    investmentTitle: { type: String, trim: true },
    journeyId: { type: String, trim: true },
    journeyTitle: { type: String, trim: true },
    preferredDuration: { type: String, trim: true },
    preferredDates: { type: String, trim: true },
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
