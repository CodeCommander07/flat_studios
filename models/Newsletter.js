// models/Newsletter.js
import mongoose from 'mongoose';

const NewsletterSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  subscribedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Newsletter || mongoose.model('Newsletter', NewsletterSchema);
