import mongoose, { Schema, type Document } from 'mongoose';
import type { UserRole } from '../../src/types/portal.ts';

export interface IUserDocument extends Document {
  fullName: string;
  email: string;
  studentId: string;
  passwordHash: string;
  role: UserRole;
  department?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['Student', 'Faculty', 'Staff'], default: 'Student' },
    department: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const UserModel =
  (mongoose.models.User as mongoose.Model<IUserDocument> | undefined) ||
  mongoose.model<IUserDocument>('User', userSchema);
