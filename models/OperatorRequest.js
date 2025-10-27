import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  key: String,
  filename: String,
  contentType: String,
  data: Buffer,
});

const OperatorRequestSchema = new mongoose.Schema({
  formData: { type: Object, required: true },
  uploadedFiles: [FileSchema],
  createdAt: { type: Date, default: Date.now },
  status:{ type: String, enum: ['pending', 'approved', 'rejected', 'implemented'], default: 'pending' },
});

export default mongoose.models.OperatorRequest ||
  mongoose.model('OperatorRequest', OperatorRequestSchema);
