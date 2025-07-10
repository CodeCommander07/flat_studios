import mongoose from 'mongoose';

const LeaveRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: String,
  startDate: String,
  endDate: String,
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  decisionDate: Date,
});


export default mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', LeaveRequestSchema);
