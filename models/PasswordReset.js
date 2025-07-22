import mongoose from 'mongoose';

const PasswordResetSchema = new mongoose.Schema({
  email: String,
    code: Number,
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 60 * 60 * 1000) },
});

export default mongoose.models.PasswordReset || mongoose.model('PasswordReset', PasswordResetSchema);
