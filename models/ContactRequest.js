import mongoose from 'mongoose';

const ContactRequestSchema = new mongoose.Schema({
  fromEmail: { type: String, required: true }, // Changed fromUserId ➝ fromEmail
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'unread' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ContactRequest ||
  mongoose.model('ContactRequest', ContactRequestSchema);
