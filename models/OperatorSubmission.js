import mongoose from 'mongoose';

const OperatorSubmissionSchema = new mongoose.Schema({
  email: String,
  robloxUsername: String,
  discordTag: String,
  operatorName: String,
  discordInvite: String,
  robloxGroup: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.OperatorSubmission ||
  mongoose.model('OperatorSubmission', OperatorSubmissionSchema);
