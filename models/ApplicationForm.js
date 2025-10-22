import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    type: { type: String, enum: ['short', 'long', 'radio', 'number'], required: true },
    options: [String],

    // 🧠 Auto-Deny System
    autoDeny: { type: Boolean, default: false },
    acceptedAnswers: [String], // e.g. ['Yes', 'Approved', '13+']
  },
  { _id: true }
);

const ApplicationFormSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  open: { type: Boolean, default: true },
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ApplicationForm ||
  mongoose.model('ApplicationForm', ApplicationFormSchema);
