import mongoose from 'mongoose';

const NewsletterSchema = new mongoose.Schema({
  title: { type: String, default: 'Untitled Newsletter' },
  design: { type: Object, default: {} },
  html: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'sent'], default: 'draft' },
}, { timestamps: true });

export default mongoose.models.Newsletter || mongoose.model('Newsletter', NewsletterSchema);
