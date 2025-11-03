import mongoose from 'mongoose';

const GameCommandSchema = new mongoose.Schema({
  serverId: { type: String, required: true },
  type: { type: String, required: true }, // kick, ban, mute, etc.
  targetId: { type: String, required: true },
  reason: String,
  issuedBy: String,
  executed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.GameCommand || mongoose.model('GameCommand', GameCommandSchema);
