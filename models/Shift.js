import mongoose from 'mongoose';

const ShiftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
});

export default mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);