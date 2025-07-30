import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  filename: String,
  data: Buffer,
  contentType: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
});

const TaskSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  taskName: String,
  taskDescription: String,
  taskStatus: { type: String, enum: ['not-started', 'in-progress', 'completed','returned', 'under-review'], default: 'not-started' },
  dueDate: Date,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date,
  files: [FileSchema],
});

const DeveloperTasksSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  tasks: [TaskSchema],
});

export default mongoose.models.DeveloperTasks || mongoose.model('DeveloperTasks', DeveloperTasksSchema);
