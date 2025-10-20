// pages/api/developers/tasks/download.js
import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  await dbConnect();

  const { taskId, fileId } = req.query;
  if (!taskId || !fileId) return res.status(400).json({ error: 'Missing taskId or fileId' });

  const doc = await DeveloperTasks.findOne({ 'tasks.taskId': taskId }, { 'tasks.$': 1 });
  if (!doc) return res.status(404).json({ error: 'Task not found' });

  const task = doc.tasks[0];
  const file = task.files.find(f => f._id.toString() === fileId);
  if (!file) return res.status(404).json({ error: 'File not found' });

  res.setHeader('Content-Disposition', `attachment; filename=${file.filename}`);
  res.setHeader('Content-Type', file.contentType);
  res.send(file.data);
}
