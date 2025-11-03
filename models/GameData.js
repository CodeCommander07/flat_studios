import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema({
  playerId: String,
  joined: { type: Date, default: Date.now },
  left: { type: Date, default: null },
});

const ChatSchema = new mongoose.Schema({
  playerId: String,
  chatMessage: String,
  time: { type: Date, default: Date.now },
});

const GameDataSchema = new mongoose.Schema(
  {
    serverId: { type: String, unique: true, required: true, index: true },
    players: [PlayerSchema],
    chat: [ChatSchema],
    flagged: { type: Boolean, default: false },
    flaggedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.GameData ||
  mongoose.model("GameData", GameDataSchema);
