import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

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

    // Make sure to match the schema enums (use dashes, not spaces)
    const allowedStatuses = ['not-started', 'in-progress', 'completed', 'returned', 'under-review'];
    if (!allowedStatuses.includes(taskStatus)) {
      return res.status(400).json({ error: 'Invalid task status' });
    }

    // Build updates for the nested task
    const updates = {
      'tasks.$.taskStatus': taskStatus,
      'tasks.$.updatedAt': new Date(),
    };

    if (taskStatus === 'completed') {
      updates['tasks.$.completedAt'] = new Date();
    } else {
      updates['tasks.$.completedAt'] = null;
    }

    // Proper nested array update using positional operator ($)
    const updatedTaskDoc = await DeveloperTasks.findOneAndUpdate(
      { 'tasks.taskId': taskId },
      { $set: updates },
      { new: true } // return the updated document
    );

    // Add a system note when status changes
    await DeveloperTasks.findOneAndUpdate(
      { 'tasks.taskId': taskId },
      {
        $push: {
          'tasks.$.notes': {
            staffMember: { name: 'System' },
            noteText: `System: Status changed to ${taskStatus}.`,
            status: taskStatus,
            system: true,
            createdAt: new Date(),
          },
        },
      }
    );

    if (!updatedTaskDoc) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Find the updated subtask for the response
    const updatedTask = updatedTaskDoc.tasks.find(t => t.taskId === taskId);

    return res.status(200).json({
      message: 'Task status updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
