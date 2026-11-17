import mongoose, { Schema, type Document } from 'mongoose';
import type { ItemCategory, ItemStatus, ItemType, UserRole } from '../../src/types/portal.ts';

export interface IItemDocument extends Document {
  trackingCode: string;
  type: ItemType;
  title: string;
  category: ItemCategory;
  description: string;
  location: string;
  dateOccurred: string;
  imageUrl?: string;
  status: ItemStatus;
  contactPreference: string;
  identifyingNote?: string;
  reportedBy: {
    userId: string;
    fullName: string;
    email: string;
    studentId: string;
    role: UserRole;
  };
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItemDocument>(
  {
    trackingCode: { type: String, required: true, unique: true },
    type: { type: String, enum: ['lost', 'found'], required: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Electronics',
        'ID Cards & Keys',
        'Bags & Wallets',
        'Books & Stationery',
        'Accessories',
        'Clothing',
        'Other',
      ],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    dateOccurred: { type: String, required: true },
    imageUrl: { type: String },
    status: {
      type: String,
      enum: ['Active', 'Claim Pending', 'Recovered', 'Archived'],
      default: 'Active',
    },
    contactPreference: { type: String, default: 'Campus Security Desk & Email' },
    identifyingNote: { type: String, trim: true },
    reportedBy: {
      userId: { type: String, required: true },
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      studentId: { type: String, required: true },
      role: { type: String, enum: ['Student', 'Faculty', 'Staff'], required: true },
    },
  },
  { timestamps: true }
);

itemSchema.index({ type: 1, category: 1, status: 1, createdAt: -1 });
itemSchema.index({ 'reportedBy.userId': 1, createdAt: -1 });
itemSchema.index({ title: 'text', description: 'text', location: 'text', trackingCode: 'text' });

export const ItemModel =
  (mongoose.models.Item as mongoose.Model<IItemDocument> | undefined) ||
  mongoose.model<IItemDocument>('Item', itemSchema);
