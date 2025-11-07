import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema({
  playerId: String,
  team:String,
  joined: { type: Date, default: Date.now },
  left: { type: Date, default: null },
});

const ChatSchema = new mongoose.Schema({
  playerId: String,
  chatMessage: String,
  time: { type: Date, default: Date.now },
});

const CommandSchema = new mongoose.Schema({
  type: String,
  targetId: String,
  reason: String,
  issuedBy: String,
  executed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const GameDataSchema = new mongoose.Schema(
  {
    serverId: { type: String, unique: true, required: true },
    players: [PlayerSchema],
    chat: [ChatSchema],
    commands: [CommandSchema], // ✅ Add this
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);


export default mongoose.models.GameData ||
  mongoose.model("GameData", GameDataSchema);
