import mongoose, { Schema } from 'mongoose';

export type DurationOption = {
  label: string;
  price: number;
  currency: string;
  description: string;
};

export type JourneyDocument = {
  title: string;
  tagline: string;
  story: string;
  location: string;
  locationLat: number;
  locationLng: number;
  coverImageUrl: string;
  coverVideoUrl: string;
  gallery: string[];
  durations: DurationOption[];
  included: string[];
  notIncluded: string[];
  maxGroupSize: number;
  spotsRemaining: number;
  guideName: string;
  guidePhoto: string;
  guideBio: string;
  guideQuote: string;
  availableDates: string[];
  status: 'draft' | 'active' | 'full' | 'past';
  createdAt?: Date;
  updatedAt?: Date;
};

const DurationOptionSchema = new Schema<DurationOption>(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'USD' },
    description: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const JourneySchema = new Schema<JourneyDocument>(
  {
    title:          { type: String, required: true, trim: true },
    tagline:        { type: String, default: '', trim: true },
    story:          { type: String, default: '', trim: true },
    location:       { type: String, default: '', trim: true },
    locationLat:    { type: Number, default: 0 },
    locationLng:    { type: Number, default: 0 },
    coverImageUrl:  { type: String, default: '', trim: true },
    coverVideoUrl:  { type: String, default: '', trim: true },
    gallery:        [{ type: String, trim: true }],
    durations:      [DurationOptionSchema],
    included:       [{ type: String, trim: true }],
    notIncluded:    [{ type: String, trim: true }],
    maxGroupSize:   { type: Number, default: 6, min: 1 },
    spotsRemaining: { type: Number, default: 6, min: 0 },
    guideName:      { type: String, default: '', trim: true },
    guidePhoto:     { type: String, default: '', trim: true },
    guideBio:       { type: String, default: '', trim: true },
    guideQuote:     { type: String, default: '', trim: true },
    availableDates: [{ type: String, trim: true }],
    status:         { type: String, enum: ['draft', 'active', 'full', 'past'], default: 'draft' },
  },
  { timestamps: true }
);

export const JourneyModel = mongoose.model<JourneyDocument>('Journey', JourneySchema);
