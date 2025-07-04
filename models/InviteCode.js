import mongoose from 'mongoose';

const InviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  role: { type: String, default: 'User' },
  createdBy: { type: String }, // Admin who created it
  expiresAt: { type: Date },
  used: { type: Boolean, default: false },
});

export default mongoose.models.Invite || mongoose.model('Invite', InviteSchema);
