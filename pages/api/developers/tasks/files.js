// pages/api/developers/tasks/files.js
import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  await dbConnect();

  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: 'Missing taskId' });

  const doc = await DeveloperTasks.findOne({ 'tasks.taskId': taskId }, { 'tasks.$': 1 });
  if (!doc) return res.status(404).json({ files: [] });

  const task = doc.tasks[0];
  res.status(200).json({ files: task.files || [] });
}
