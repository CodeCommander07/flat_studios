import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  page: { type: Number, required: true },
  order: { type: Number, default: 0 },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'textarea', 'select', 'radio', 'checkbox', 'file'],
    required: true
  },
  options: [String],
  required: { type: Boolean, default: true },
  placeholder: String,
  helperText: String,

  // 🧠 Conditional logic support
  triggerQuestionId: { type: String }, // ID or label of the parent question
  triggerValue: { type: String }, // value that triggers visibility
  hiddenByDefault: { type: Boolean, default: false },

  autoSource: {
  type: String,
  enum: ['stops', 'routes', null],
  default: null,
},

});

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);
