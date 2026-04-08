import { Schema } from 'mongoose';

export const mongoUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    tenantId: { type: String, required: true, index: true },
    status: { type: String, required: true, default: 'active' },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
