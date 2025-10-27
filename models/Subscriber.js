import mongoose from 'mongoose';

const SubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Subscriber || mongoose.model('Subscriber', SubscriberSchema);
