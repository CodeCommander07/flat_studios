import mongoose from 'mongoose';

const DisciplinarySchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // disciplined user
  issuedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true,},
  reason: { type: String, required: true },
  severity: { type: String, enum: ['Verbal Warning', 'Warning', 'Suspension', 'Termination'], default: 'Warning' },
  notes: { type: String },
  status: { type: String, enum: ['Active', 'Appealed', 'Resolved'], default: 'Active' },
}, { timestamps: true });

export default mongoose.models.Disciplinary ||
  mongoose.model('Disciplinary', DisciplinarySchema);
