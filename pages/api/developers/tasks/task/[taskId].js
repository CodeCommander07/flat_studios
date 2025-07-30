// pages/api/developers/tasks/task/[taskId].js
import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export default async function handler(req, res) {
  await dbConnect();
  const { taskId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Find the document that contains a task with the given taskId
    const devTaskDoc = await DeveloperTasks.findOne({ 'tasks.taskId': taskId }).lean();
    if (!devTaskDoc) return res.status(404).json({ error: 'Task not found' });

    const task = devTaskDoc.tasks.find(t => t.taskId === taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // For each file, return only metadata and a download URL (if you implement file downloading)
    const safeFiles = task.files.map(file => ({
      _id: file._id,
      filename: file.filename,
      contentType: file.contentType,
      size: file.size,
      uploadedAt: file.uploadedAt,
      downloadUrl: `/api/developers/tasks/download?taskId=${taskId}&fileId=${file._id}`
    }));

    return res.status(200).json({ ...task, files: safeFiles });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
