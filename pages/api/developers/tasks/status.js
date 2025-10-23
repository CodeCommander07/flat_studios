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

    // ✅ Allow all current frontend statuses
    const allowedStatuses = ['not-started', 'developing', 'completed', 'reviewed', 'implemented'];
    if (!allowedStatuses.includes(taskStatus)) {
      console.warn('Invalid taskStatus received:', taskStatus);
      return res.status(400).json({ error: `Invalid task status: ${taskStatus}` });
    }

    // ✅ Update the nested task (atomic operation)
    const updatedTaskDoc = await DeveloperTasks.findOneAndUpdate(
      { 'tasks.taskId': taskId },
      {
        $set: {
          'tasks.$.taskStatus': taskStatus,
          'tasks.$.updatedAt': new Date(),
          ...(taskStatus === 'completed'
            ? { 'tasks.$.completedAt': new Date() }
            : { 'tasks.$.completedAt': null }),
        },
      },
      { new: true }
    );

    if (!updatedTaskDoc) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // ✅ Now safely add the system note using array filters (ensures note goes to correct subtask)
    const parentTaskId = updatedTaskDoc._id;
    await DeveloperTasks.updateOne(
      { _id: parentTaskId },
      {
        $push: {
          'tasks.$[t].notes': {
            staffMember: { name: 'System' },
            noteText: `System: Status changed to ${taskStatus}.`,
            status: taskStatus,
            system: true,
            createdAt: new Date(),
          },
        },
      },
      {
        arrayFilters: [{ 't.taskId': taskId }],
      }
    );

    // ✅ Return the updated subtask only
    const updatedTask = updatedTaskDoc.tasks.find((t) => t.taskId === taskId);

    return res.status(200).json({
      message: 'Task status updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
