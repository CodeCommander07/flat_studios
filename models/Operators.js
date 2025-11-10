import mongoose from 'mongoose';

const OperatorSubmissionSchema = new mongoose.Schema({
  email: String,
  robloxUsername: String,
  discordTag: String,
  operatorName: String,
  discordInvite: String,
  robloxGroup: String,
  description: String,
  logo: {
    data: Buffer,
    contentType: String,
  },
}, { timestamps: true });

export default mongoose.models.OperatorSubmission ||
  mongoose.model('OperatorSubmission', OperatorSubmissionSchema);
