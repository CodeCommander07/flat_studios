import mongoose from 'mongoose';

const DeletedEmailSchema = new mongoose.Schema({
  messageId: { type: String, unique: true, required: true },
  subject: { type: String }, // ✅ add this line
  deleted: { type: Boolean, default: false },
  flagged: { type: Boolean, default: false },
  flags: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  deletedAt: { type: Date, default: Date.now },
});

export default mongoose.models.DeletedEmail || mongoose.model('DeletedEmail', DeletedEmailSchema);
