import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';
import { notifyUser } from '@/utils/notifyUser';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { taskId, taskStatus } = req.body;

    if (!taskId || !taskStatus) {
      return res.status(400).json({ error: 'Missing required fields (taskId, taskStatus)' });
    }

    const allowedStatuses = ['not-started', 'developing', 'completed', 'reviewed', 'implemented'];
    if (!allowedStatuses.includes(taskStatus)) {
      return res.status(400).json({ error: `Invalid task status: ${taskStatus}` });
    }

    const now = new Date();

    const updateData = {
      'tasks.$.taskStatus': taskStatus,
      'tasks.$.updatedAt': now,
    };

    if (taskStatus === 'completed') {
      updateData['tasks.$.completedAt'] = now;
      updateData['tasks.$.reviewedAt'] = null;
      updateData['tasks.$.implementedAt'] = null;
    }

    if (taskStatus === 'reviewed') {
      updateData['tasks.$.reviewedAt'] = now;
      updateData['tasks.$.implementedAt'] = null;
    }

    if (taskStatus === 'implemented') {
      updateData['tasks.$.implementedAt'] = now;
    }

    if (['not-started', 'developing'].includes(taskStatus)) {
      updateData['tasks.$.completedAt'] = null;
      updateData['tasks.$.reviewedAt'] = null;
      updateData['tasks.$.implementedAt'] = null;
    }

    // UPDATE + POPULATE
    const updatedTaskDoc = await DeveloperTasks.findOneAndUpdate(
      { 'tasks.taskId': taskId },
      { $set: updateData },
      { new: true }
    ).populate('user', 'email username');

    if (!updatedTaskDoc) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Extract this specific task
    const updatedTask = updatedTaskDoc.tasks.find((t) => t.taskId === taskId);

    // SAFELY GET THE TASK NAME FOR THE NOTIFICATION
    const taskName = updatedTask?.taskName || "A task";

    // SEND NOTIFICATION
    await notifyUser(
      updatedTaskDoc.user, // populated user
      `${taskName} status has been updated to ${taskStatus.replace('-', ' ')}.`,
      `/dev/tasks/${taskId}`
    );

    return res.status(200).json({
      message: 'Task status updated successfully',
      task: updatedTask,
    });

  } catch (error) {
    console.error('Error updating task status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
