import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Unique identifier for the user
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true }, // Note: should be hashed
  
  defaultAvatar: { type: String }, // Default avatar URL

  // System Role
  role: { type: String, default: 'User' },
  operator: { type: String, default: false, enum:["South West Buses", "IRVING Coaches", "West Coast Motors", "Cowie"] }, // Is the user an operator?

  // Connections
  robloxId: { type: String }, // Numeric ID from Roblox
  robloxUsername: { type: String },
  robloxAvatar: { type: String },
  
  discordId: { type: String }, // Discord User ID (Snowflake)
  discordUsername: { type: String }, // e.g. Obi#1234
  discordAvatar: { type: String }, // e.g. Obi#1234

  googleId: { type: String }, // Discord User ID (Snowflake)
  googleUsername: { type: String }, // e.g. Obi#1234
  googleAvatar: { type: String }, // e.g. Obi#1234

  // Metadata
  createdAt: { type: Date, default: Date.now },

  newsletter: { type: Boolean, default: true }, // Opt-in for newsletters
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
