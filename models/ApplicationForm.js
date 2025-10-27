import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  id: String,
  label: String,
  type: { type: String, enum: ['short', 'long', 'radio', 'number', 'checkbox'], default: 'short' },
  options: [String],
  autoDeny: { type: Boolean, default: false },
  acceptedAnswers: [String],
});

const ApplicationFormSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  requirements: { type: String, default: '' }, // ✅ Make sure this is here
  open: { type: Boolean, default: true },
  questions: [QuestionSchema],
}, { timestamps: true });

export default mongoose.models.ApplicationForm || mongoose.model('ApplicationForm', ApplicationFormSchema);
