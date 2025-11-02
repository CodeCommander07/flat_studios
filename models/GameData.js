import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  playerId: String,
});
const ChatSchema = new mongoose.Schema({
  playerId: String,
  chatMessage: String,
});

const GameDataSchema = new mongoose.Schema({
  serverId: { type: String, unique: true, required: true }, // Unique email ID (e.g. Message-ID header)
  players:[PlayerSchema],
  chat:[ChatSchema],
}, { timestamps: true });

export default mongoose.models.GameData || mongoose.model('GameData', GameDataSchema);
