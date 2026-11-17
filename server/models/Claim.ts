import mongoose, { Schema, type Document } from 'mongoose';
import type { ClaimStatus, ItemType, UserRole } from '../../src/types/portal.ts';

export interface IClaimDocument extends Document {
  claimCode: string;
  itemId: string;
  itemTitle: string;
  itemTrackingCode: string;
  itemType: ItemType;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  claimantStudentId: string;
  claimantRole: UserRole;
  proofDescription: string;
  distinctiveMarks: string;
  lostDateApprox: string;
  status: ClaimStatus;
  staffReviewerName?: string;
  staffNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const claimSchema = new Schema<IClaimDocument>(
  {
    claimCode: { type: String, required: true, unique: true },
    itemId: { type: String, required: true, index: true },
    itemTitle: { type: String, required: true },
    itemTrackingCode: { type: String, required: true },
    itemType: { type: String, enum: ['lost', 'found'], required: true },
    claimantId: { type: String, required: true, index: true },
    claimantName: { type: String, required: true },
    claimantEmail: { type: String, required: true },
    claimantStudentId: { type: String, required: true },
    claimantRole: { type: String, enum: ['Student', 'Faculty', 'Staff'], required: true },
    proofDescription: { type: String, required: true, trim: true },
    distinctiveMarks: { type: String, required: true, trim: true },
    lostDateApprox: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending Review', 'Approved', 'Rejected', 'Handed Over'],
      default: 'Pending Review',
    },
    staffReviewerName: { type: String },
    staffNotes: { type: String },
  },
  { timestamps: true }
);

export const ClaimModel =
  (mongoose.models.Claim as mongoose.Model<IClaimDocument> | undefined) ||
  mongoose.model<IClaimDocument>('Claim', claimSchema);
