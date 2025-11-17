import mongoose from "mongoose";

const ModLogSchema = new mongoose.Schema({
  action: String,
  targetId: String,
  moderator: {
    id: String,
    username: String,
  },
  reason: String,
  serverId: String,
  duration: Number,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.ModLog || mongoose.model("ModLog", ModLogSchema);
