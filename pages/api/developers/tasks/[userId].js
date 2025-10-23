import mongoose from 'mongoose';
import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  await dbConnect();

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  // 🚨 Prevent CastError
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  const doc = await DeveloperTasks.findOne({ user: userId });
  if (!doc) return res.status(200).json({ tasks: [] });

  return res.status(200).json({ user:userId, tasks: doc.tasks });
}
