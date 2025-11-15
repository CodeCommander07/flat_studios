import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  filename: String,
  data: Buffer,
  contentType: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

const NoteSchema = new mongoose.Schema({
  staffMember: Object,  // same as in hiring system
  noteText: String,
  status: String,
  system: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const TaskSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  taskName: String,
  taskDescription: String,
  taskStatus: { type: String, enum: ['not-started', 'developing', 'completed', 'reviewed', 'implemented'], default: 'not-started' },
  dueDate: Date,
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  user: Object,
  completedAt: Date,
  reviewedAt: Date,
  implementedAt: Date,
  files: [FileSchema],
  notes: [NoteSchema],
});

const DeveloperTasksSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  tasks: [TaskSchema],
});

export default mongoose.models.DeveloperTasks || mongoose.model('DeveloperTasks', DeveloperTasksSchema);
