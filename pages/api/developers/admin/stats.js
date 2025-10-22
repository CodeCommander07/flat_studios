import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const allDevs = await DeveloperTasks.find({});
    const allTasks = allDevs.flatMap(dev => dev.tasks || []);

    const totalSet = allTasks.length;
    const totalReturned = allTasks.filter(t => t.taskStatus === 'completed').length;

    res.status(200).json({
      totalSet,
      totalReturned,
    });
  } catch (err) {
    console.error('Error fetching developer task stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
