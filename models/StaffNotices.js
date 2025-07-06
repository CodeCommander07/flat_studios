import mongoose from 'mongoose';

const StaffNoticesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['announcement', 'update', 'alert'], default: 'announcement' },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
})

export default mongoose.models.StaffNotices || mongoose.model('StaffNotices', StaffNoticesSchema);