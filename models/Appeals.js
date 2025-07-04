import mongoose from 'mongoose';

const AppealsSchema = new mongoose.Schema({
  email: String,
  DiscordUsername: String,
  DiscordId: String,
  RobloxUsername: String,
  banDate: { type: Date, required: true },
  banReason: String,
  staffMember: String,
  unbanReason: String,
  createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Reviewed', 'Denied'], default: 'Pending' },
});

export default mongoose.models.Appeals || mongoose.model('Appeals', AppealsSchema);
