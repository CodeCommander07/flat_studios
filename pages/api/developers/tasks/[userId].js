// GET /api/developers/tasks/[taskId]
import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  await dbConnect();

  const { taskId } = req.query;

  const doc = await DeveloperTasks.findOne({ 'tasks._id': taskId });
  if (!doc) return res.status(404).json({ error: 'Task not found' });

  const task = doc.tasks.id(taskId);
  res.status(200).json(task);
}
