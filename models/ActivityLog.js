// /models/ActivityLog.js

import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true }, // in hours (float)
  description: { type: String, required: true },
}, {
  timestamps: true,
});

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
