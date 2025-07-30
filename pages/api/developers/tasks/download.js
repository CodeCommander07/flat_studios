// pages/api/developers/tasks/download.js
import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  await dbConnect();

  const { taskId, fileId } = req.query;
  if (!taskId || !fileId) {
    return res.status(400).json({ error: 'Missing taskId or fileId' });
  }

  try {
    const dev = await DeveloperTasks.findOne({ "tasks.taskId": taskId });
    if (!dev) return res.status(404).json({ error: 'Task not found' });

    const task = dev.tasks.find(t => t.taskId === taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const file = task.files.id(fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', file.contentType);
    return res.send(file.data);
  } catch (error) {
    console.error('Error during file download:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
