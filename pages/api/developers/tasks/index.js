// GET /api/developers/tasks?userId=...
import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  await dbConnect();

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const data = await DeveloperTasks.findOne({ user: userId });
  if (!data) return res.status(404).json({ error: 'No tasks for user' });

  res.status(200).json(data.tasks);
}
