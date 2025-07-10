import mongoose from 'mongoose';

const NewsletterSchema = new mongoose.Schema({
    email: { type: String, required: true },
    username: { type: String, required: true },
});

export default mongoose.models.Newsletter || mongoose.model('Newsletter', NewsletterSchema);
