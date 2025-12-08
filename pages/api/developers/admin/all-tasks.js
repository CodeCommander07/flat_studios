import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const devTasks = await DeveloperTasks.find({})
      .populate('user', 'username email robloxUsername discordUsername defaultAvatar')
      .lean();

    const allTasks = devTasks.flatMap(dev =>
      (dev.tasks || []).map(task => ({
        taskId: task.taskId,
        taskName: task.taskName,
        taskDescription: task.taskDescription,
        taskStatus: task.taskStatus,
        dueDate: task.dueDate,
        priority: task.priority,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt,

        // REQUIRED FOR YOUR UI:
        user: {
          _id: dev.user?._id,
          username: dev.user?.username,
          email: dev.user?.email,
          defaultAvatar: dev.user?.defaultAvatar,
          discordUsername: dev.user?.discordUsername,
          robloxUsername: dev.user?.robloxUsername,
        },

        // Convenience fields:
        userId: dev.user?._id,
        userName: dev.user?.username || 'Unknown',
        userEmail: dev.user?.email || 'N/A',
      }))
    );

    res.status(200).json({ tasks: allTasks });
  } catch (err) {
    console.error('Error fetching all tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}
