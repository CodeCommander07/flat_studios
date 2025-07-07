import mongoose from 'mongoose';

const EmailSchema = new mongoose.Schema({
  messageId: { type: String, unique: true, required: true }, // Unique email ID (e.g. Message-ID header)
  subject: { type: String },
  from: { type: String, required: true },
  to: { type: String, required: true },
  date: { type: Date, default: Date.now },
  text: { type: String },
  html: { type: String },
  inReplyTo: { type: String }, // Message-ID of email this replies to (optional)
}, { timestamps: true });

export default mongoose.models.Email || mongoose.model('Email', EmailSchema);
