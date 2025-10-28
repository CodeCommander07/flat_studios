import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  questionLabel: String,
  answer: String,
}, { _id: false });

const NoteSchema = new mongoose.Schema({
  staffMember: Object,
  noteText: String,
  status: String,
  system: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const SubmittedApplicationSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApplicationForm', required: true },
  applicantEmail: { type: String, required: true },
  answers: [AnswerSchema],
  status: { type: String, enum: ['pending','accepted','denied','talented'], default: 'pending' },
  denyReason: { type: String, default: null },
  notes: [NoteSchema], // ✅ added
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.models.SubmittedApplication || mongoose.model('SubmittedApplication', SubmittedApplicationSchema);
