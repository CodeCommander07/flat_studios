// models/OperatorApplication.js
import mongoose from 'mongoose';

const OperatorApplicationSchema = new mongoose.Schema(
  {
    // raw submitted fields (exactly your form shape)
    email: String,
    robloxUsername: String,
    discordUsername: String,
    discordId: String,
    robloxId: String,
    operatorName: String,
    operatorFleet: String,
    operatorDiscord: String,
    operatorRoblox: String,
    operatorColor: String,
    reason: String,

    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Implemented'],
      default: 'Pending',
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.OperatorApplication ||
  mongoose.model('OperatorApplication', OperatorApplicationSchema);
