import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') return res.status(405).end();

  const all = await DeveloperTasks.find({})
    .populate('user', 'username email')
    .lean();

  const tasks = all.flatMap((entry) =>
    entry.tasks.map(task => ({
      ...task,
      userId: entry.user._id,
      userName: entry.user.name,
      userEmail: entry.user.email,
    }))
  );

  // Sort by dueDate ascending, then status
  const statusOrder = { pending: 0, 'in-progress': 1, completed: 2 };
  tasks.sort((a, b) => {
    const d1 = new Date(a.dueDate), d2 = new Date(b.dueDate);
    if (d1 - d2 !== 0) return d1 - d2;
    return statusOrder[a.taskStatus] - statusOrder[b.taskStatus];
  });

  res.status(200).json(tasks);
}
