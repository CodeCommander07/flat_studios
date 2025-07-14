import mongoose from 'mongoose';
const AnswerSchema = new mongoose.Schema({
  questionLabel: String,
  answer: String,
}, { _id: false });
const SubmittedApplicationSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApplicationForm', required: true },
  applicantEmail: { type: String, required: true },
  answers: [AnswerSchema],
  status: { type: String, enum: ['pending','accepted','denied','flagged'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.models.SubmittedApplication || mongoose.model('SubmittedApplication', SubmittedApplicationSchema);
