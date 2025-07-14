import mongoose from 'mongoose';
const QuestionSchema = new mongoose.Schema({
  label: String,
  type: { type: String, enum: ['short','long','radio'] },
  options: [String],
}, { _id: false });
const ApplicationFormSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  open: { type: Boolean, default: true },
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.models.ApplicationForm || mongoose.model('ApplicationForm', ApplicationFormSchema);
