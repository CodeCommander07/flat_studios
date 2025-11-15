import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { notifyUser } from '@/utils/notifyUser';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' });

  await dbConnect();

  const { taskName, taskDescription, user, dueDate, priority } = req.body;

  // Validate fields
  if (!taskName || !taskDescription || !user || !dueDate) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const objectId = new mongoose.Types.ObjectId(user._id);
    const newTask = {
      taskId: uuidv4(),
      taskName,
      taskDescription,
      dueDate: new Date(dueDate),
      priority: priority || 'low',
      taskStatus: 'not-started',
      createdAt: new Date(),
      updatedAt: new Date(),
      user
    };

    // Find or create developer’s task list
    let developerTasks = await DeveloperTasks.findOne({ user: objectId });

    if (!developerTasks) {
      developerTasks = new DeveloperTasks({
        user: objectId,
        tasks: [newTask],
      });
    } else {
      developerTasks.tasks.push(newTask);
    }

    await developerTasks.save();
    notifyUser(user, `A new task has been added to you to do list.`, '/dev/tasks')

    return res.status(201).json({
      message: 'Task created successfully!',
      task: newTask,
    });
  } catch (err) {
    console.error('❌ Failed to create developer task:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
