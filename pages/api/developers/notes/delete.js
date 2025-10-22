import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'DELETE')
    return res.status(405).json({ error: 'Method not allowed' });

  const { taskId, noteId } = req.query;
  if (!taskId || !noteId)
    return res.status(400).json({ error: 'Missing taskId or noteId' });

  try {
    const doc = await DeveloperTasks.findOne({ 'tasks.taskId': taskId });
    if (!doc) return res.status(404).json({ error: 'Task not found' });

    const task = doc.tasks.find((t) => t.taskId === taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.notes = task.notes.filter((n) => n._id.toString() !== noteId);
    await doc.save();

    return res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
