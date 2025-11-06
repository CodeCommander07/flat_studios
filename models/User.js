import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  notification: { type: String, required: true },
  link: { type: String, default: null },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Unique identifier for the user
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true }, // Note: should be hashed
  
  defaultAvatar: { type: String }, // Default avatar URL

  // System Role
  role: { type: String, default: 'User' },
  operator: { 
    type: String, 
    enum: ["South West Buses", "IRVING Coaches", "West Coast Motors", "Slowcoach"] 
  },

  // Connections
  robloxId: { type: String },
  robloxUsername: { type: String },
  robloxAvatar: { type: String },
  
  discordId: { type: String },
  discordUsername: { type: String },
  discordAvatar: { type: String },

  googleId: { type: String },
  googleUsername: { type: String },
  googleAvatar: { type: String },

  // Notifications
  notifications: [NotificationSchema],

  // Metadata
  createdAt: { type: Date, default: Date.now },
  newsletter: { type: Boolean, default: true },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
