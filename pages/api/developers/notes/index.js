import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  await dbConnect();

  try {
    // 🟢 GET: Fetch all notes for a task
    if (req.method === 'GET') {
      const { taskId } = req.query;
      if (!taskId) return res.status(400).json({ error: 'Missing taskId' });

      const doc = await DeveloperTasks.findOne({ 'tasks.taskId': taskId }, { 'tasks.$': 1 });
      if (!doc || !doc.tasks?.length) return res.status(404).json({ error: 'Task not found' });

      const notes = doc.tasks[0].notes || [];
      return res.status(200).json({ notes });
    }

    // 🟠 POST: Add a new note
    if (req.method === 'POST') {
      const { taskId, noteText, staffMember, status, system } = req.body;

      if (!taskId || !noteText)
        return res.status(400).json({ error: 'Missing required fields (taskId, noteText)' });

      // Find parent task
      const doc = await DeveloperTasks.findOne({ 'tasks.taskId': taskId });
      if (!doc) return res.status(404).json({ error: 'Task not found' });

      const task = doc.tasks.find((t) => t.taskId === taskId);
      if (!task) return res.status(404).json({ error: 'Task not found' });

      // Construct the note object (aligned with your schema)
      const note = {
        staffMember: staffMember || { name: 'System' },
        noteText,
        status: status || task.taskStatus,
        system: system || false,
        createdAt: new Date(),
      };

      // Push and save
      task.notes.push(note);
      await doc.save();

      return res.status(201).json({ message: 'Note added', note });
    }

    // 🔴 DELETE: Remove a note by index or text match (optional)
    if (req.method === 'DELETE') {
      const { taskId, createdAt } = req.query;
      if (!taskId || !createdAt)
        return res.status(400).json({ error: 'Missing taskId or createdAt (timestamp)' });

      const doc = await DeveloperTasks.findOne({ 'tasks.taskId': taskId });
      if (!doc) return res.status(404).json({ error: 'Task not found' });

      const task = doc.tasks.find((t) => t.taskId === taskId);
      if (!task) return res.status(404).json({ error: 'Task not found' });

      const originalLength = task.notes.length;
      task.notes = task.notes.filter(
        (n) => new Date(n.createdAt).getTime() !== new Date(createdAt).getTime()
      );

      if (task.notes.length === originalLength)
        return res.status(404).json({ error: 'Note not found' });

      await doc.save();
      return res.status(200).json({ message: 'Note deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in notes API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
