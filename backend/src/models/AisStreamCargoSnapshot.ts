import mongoose, { Schema } from 'mongoose';

export type AisShipPosition = {
  mmsi: number;
  lat: number;
  lng: number;
  lastSeen: string;
  sogKnots: number | null;
  cogDegrees: number | null;
};

export type AisStreamCargoSnapshotDocument = {
  snapshotKey: string;
  mmsi: number;
  lat: number;
  lng: number;
  lastSeen: string;
  sogKnots: number | null;
  cogDegrees: number | null;
  rawMessage: unknown;
  collectedAt: Date;
  expiresAt: Date;
  sourceWindowStartedAt: Date;
  sourceWindowEndedAt: Date;
  trackedMmsiList: string[];
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const AisShipPositionSchema = new Schema<AisShipPosition>(
  {
    mmsi: { type: Number, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    lastSeen: { type: String, required: true },
    sogKnots: { type: Number, default: null },
    cogDegrees: { type: Number, default: null },
  },
  { _id: false }
);

const AisStreamCargoSnapshotSchema = new Schema<AisStreamCargoSnapshotDocument>(
  {
    snapshotKey: { type: String, required: true, index: true },
    mmsi: { type: Number, required: true, index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    lastSeen: { type: String, required: true },
    sogKnots: { type: Number, default: null },
    cogDegrees: { type: Number, default: null },
    rawMessage: { type: Schema.Types.Mixed, required: false, default: null },
    collectedAt: { type: Date, required: true, default: () => new Date() },
    expiresAt: { type: Date, required: true },
    sourceWindowStartedAt: { type: Date, required: true },
    sourceWindowEndedAt: { type: Date, required: true },
    trackedMmsiList: { type: [String], required: true, default: [] },
    status: { type: String, required: true, default: 'collecting' },
  },
  {
    collection: 'aisstreamcargolist',
    timestamps: true,
  }
);

export const AisStreamCargoSnapshotModel = mongoose.model<AisStreamCargoSnapshotDocument>(
  'AisStreamCargoSnapshot',
  AisStreamCargoSnapshotSchema
);
