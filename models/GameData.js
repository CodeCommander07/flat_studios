import mongoose from "mongoose";

const BusSchema = new mongoose.Schema({
  vehicleOwner: String,
  vehicleType: String,
  vehicleLivery: String,
  route: String,
  destination: String,
  currentLocation: String,
  vehicleInformation: {
    topSpeed: String,
    topModel: String,
    fleetNumber: String,
  },
  lastUpdated: { type: Date, default: Date.now }
});

const ModerationSchema = new mongoose.Schema({
  muted: {
    active: { type: Boolean, default: false },
    reason: String,
    moderator: String,
    timestamp: Date
  },
  serverBan: {
    active: { type: Boolean, default: false },
    reason: String,
    moderator: String,
    timestamp: Date
  },
  globalBan: {
    active: { type: Boolean, default: false },
    reason: String,
    moderator: String,
    timestamp: Date,
    expiresAt: Date 
  }
});

const PlayerSchema = new mongoose.Schema({
  playerId: String,
  username: String,
  team: { type: String, default: "Unassigned" },
  joined: { type: Date, default: Date.now },
  left: { type: Date, default: null },
  bus: { type: BusSchema, default: null },
  moderation: { type: ModerationSchema, default: {} }
});

const ChatSchema = new mongoose.Schema({
  playerId: String,
  username: String,
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

const PlayerLogSchema = new mongoose.Schema({
  type: { type: String, enum: ["join", "leave"], required: true },
  playerId: String,
  username: String,
  timestamp: { type: Date, default: Date.now },
});

const AuditLogSchema = new mongoose.Schema({
  action: String,
  targetId: String,
  targetName: String,
  moderatorId: String,
  moderatorName: String,
  reason: String,
  scope: String,
  banType: String,
  createdAt: { type: Date, default: Date.now }
});
const GameDataSchema = new mongoose.Schema(
  {
    serverId: { type: String, unique: true, required: true },
    players: [PlayerSchema],
    chat: [ChatSchema],
    commands: [CommandSchema],
    logs: [PlayerLogSchema],
    audit: [AuditLogSchema],
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.GameData ||
  mongoose.model("GameData", GameDataSchema);
