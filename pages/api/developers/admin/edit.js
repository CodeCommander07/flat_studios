import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';
import mongoose from 'mongoose';
import { notifyUser } from '@/utils/notifyUser';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' });

  await dbConnect();

  const { taskId, userId, updates } = req.body;

  if (!taskId || !userId || !updates) {
    return res.status(400).json({ error: 'Missing required fields: taskId, userId, updates' });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Build update object for MongoDB nested update
    const updateData = {};

    if (updates.taskName) updateData['tasks.$[t].taskName'] = updates.taskName;
    if (updates.taskDescription) updateData['tasks.$[t].taskDescription'] = updates.taskDescription;
    if (updates.dueDate) updateData['tasks.$[t].dueDate'] = new Date(updates.dueDate);
    if (updates.priority) updateData['tasks.$[t].priority'] = updates.priority;
    if (updates.taskStatus) updateData['tasks.$[t].taskStatus'] = updates.taskStatus;

    // Assigned user update
    if (updates.user) {
      updateData['tasks.$[t].user'] = updates.user;  
    }

    updateData['tasks.$[t].updatedAt'] = new Date();

    // Actual MongoDB update
    const result = await DeveloperTasks.updateOne(
      { user: userObjectId },
      { $set: updateData },
      { arrayFilters: [{ "t.taskId": taskId }] }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Task not found or no changes applied.' });
    }

    // Optional: notify developer
    notifyUser({ _id: userId }, "A task assigned to you has been updated.", "/dev/tasks");

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
    });

  } catch (err) {
    console.error('❌ Task update error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
