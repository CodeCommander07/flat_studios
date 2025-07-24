import mongoose from 'mongoose';

const UserFileSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  filename: { type: String, required: true },
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.models.UserFile || mongoose.model('UserFile', UserFileSchema);
