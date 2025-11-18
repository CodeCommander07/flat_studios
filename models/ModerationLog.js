import mongoose from 'mongoose';

const ModerationLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['kick', 'ban', 'unban', 'mute', 'unmute'],
      required: true,
    },
    targetId: { type: String, required: true },
    targetName: { type: String },
    moderatorId: { type: String },
    moderatorName: { type: String },
    serverId: { type: String },
    scope: { type: String }, // 'global' | 'server' | etc
    reason: { type: String },

    // ban-specific
    banType: { type: String }, // 'permanent' | 'temporary' | 'server-only'
    expiresAt: { type: Date },

    rawResponse: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.ModerationLog ||
  mongoose.model('ModerationLog', ModerationLogSchema);
