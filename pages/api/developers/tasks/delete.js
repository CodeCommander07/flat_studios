// pages/api/developers/tasks/delete.js
import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method Not Allowed' });
  await dbConnect();

  const { taskId, fileId } = req.query;
  if (!taskId || !fileId) return res.status(400).json({ error: 'Missing taskId or fileId' });

  const updated = await DeveloperTasks.findOneAndUpdate(
    { 'tasks.taskId': taskId },
    { $pull: { 'tasks.$.files': { _id: fileId } } },
    { new: true }
  );

  if (!updated) return res.status(404).json({ error: 'Task not found' });

  res.status(200).json({ message: 'File deleted', files: updated.tasks[0].files });
}
