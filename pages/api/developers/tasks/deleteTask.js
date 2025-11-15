import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';
import notifyUser from '@/utils/notifyUser';

export default async function handler(req, res) {
  if (req.method !== 'DELETE')
    return res.status(405).json({ error: 'Method Not Allowed' });

  await dbConnect();

  const { taskId } = req.query;

  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' });
  }

  try {
    const dev = await DeveloperTasks.findOne(
      { "tasks.taskId": taskId },
      { "tasks.$": 1, user: 1 } 
    ).populate('user', 'email username');

    if (!dev || !dev.tasks || dev.tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const deletedTask = dev.tasks[0]; 
    await DeveloperTasks.findOneAndUpdate(
      { "tasks.taskId": taskId },
      { $pull: { tasks: { taskId } } }
    );
    if (dev.user) {
      await notifyUser(
        dev.user,
        `${deletedTask.taskName || "Your task"} has been removed from your to-do list.`,
        `/dev/tasks`
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });

  } catch (err) {
    console.error("❌ Error deleting task:", err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
