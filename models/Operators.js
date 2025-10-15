import mongoose from 'mongoose';

const OperatorSubmissionSchema = new mongoose.Schema({
  email: String,
  robloxUsername: String,
  discordTag: String,
  operatorName: String,
  discordInvite: String,
  robloxGroup: String,
  
});

export default mongoose.models.OperatorSubmission ||
  mongoose.model('OperatorSubmission', OperatorSubmissionSchema);
