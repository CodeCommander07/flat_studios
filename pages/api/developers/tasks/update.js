// POST /api/developers/tasks/update
import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  await dbConnect();

  const { taskId, userId, updates } = req.body;
  if (!taskId || !userId || !updates) return res.status(400).json({ error: 'Missing required data' });

  const doc = await DeveloperTasks.findOne({ user: userId });
  if (!doc) return res.status(404).json({ error: 'User not found' });

  const task = doc.tasks.id(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  Object.assign(task, updates); // Safely apply only intended updates
  task.updatedAt = new Date();
  await doc.save();

  res.status(200).json({ message: 'Task updated', task });
}
