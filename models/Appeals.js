import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  staffMember: { type: String, required: true },
  noteText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const AppealSchema = new mongoose.Schema({
  email: String,
  DiscordUsername: String,
  DiscordId: String,
  RobloxUsername: String,
  RobloxId: String,
  banDate: Date,
  banReason: String,
  unbanReason: String,
  staffMember: String,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Accepted', 'Denied', 'Flagged'], default: 'Pending' },
  notes: [NoteSchema], // NEW: store notes here
  denyReason: String,
});

export default mongoose.models.Appeal || mongoose.model('Appeal', AppealSchema);
