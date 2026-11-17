import mongoose, { Schema, type Document } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: string;
  title: string;
  message: string;
  type: 'claim' | 'status' | 'match';
  relatedItemId?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['claim', 'status', 'match'], default: 'status' },
    relatedItemId: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<INotificationDocument> | undefined) ||
  mongoose.model<INotificationDocument>('Notification', notificationSchema);
