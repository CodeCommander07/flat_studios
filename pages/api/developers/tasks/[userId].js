// GET /api/developers/tasks/[userId]
import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const doc = await DeveloperTasks.findOne({ user: userId });

  if (!doc) {
    return res.status(200).json({ tasks: [] }); // return empty array if no tasks
  }

  res.status(200).json({ tasks: doc.tasks });
}
