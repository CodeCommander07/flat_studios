import mongoose from 'mongoose';

const WeeklyReportSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    buffer: { type: Buffer },  
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.WeeklyReport ||
  mongoose.model('WeeklyReport', WeeklyReportSchema);
