import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') return res.status(405).end();

  try {
    // Get all developer task entries (each user’s task array)
    const all = await DeveloperTasks.find({})
      .populate('user', 'username email')
      .lean();

    // Flatten and filter only returned tasks
    const returned = all.flatMap((entry) =>
      (entry.tasks || [])
        .filter((task) => task.taskStatus === 'completed')
        .map((task) => ({
          ...task,
          userId: entry.user?._id || null,
          userName: entry.user?.username || 'Unknown User',
          userEmail: entry.user?.email || 'Unknown Email',
        }))
    );

    // Sort newest first (based on updatedAt)
    returned.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.status(200).json({ tasks: returned });
  } catch (err) {
    console.error('Error fetching returned tasks:', err);
    res.status(500).json({ error: 'Failed to fetch returned tasks' });
  }
}
