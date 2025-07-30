import formidable from 'formidable';
import fs from 'fs';
import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Form parsing error' });

    const { taskId, userId } = fields;

    if (!taskId || !userId) {
      return res.status(400).json({ error: 'Missing taskId or userId' });
    }

    const uploadedFiles = Object.values(files);

    const fileDataArray = uploadedFiles.map(file => ({
      filename: file.originalFilename,
      data: fs.readFileSync(file.filepath),
      contentType: file.mimetype,
      size: file.size,
    }));

    try {
      const developer = await DeveloperTasks.findOne({ user: userId });

      if (!developer) return res.status(404).json({ error: 'Developer not found' });

      const task = developer.tasks.find(t => t.taskId === taskId);

      if (!task) return res.status(404).json({ error: 'Task not found' });

      task.files.push(...fileDataArray);
      task.updatedAt = new Date();

      await developer.save();

      return res.status(200).json({ success: true, task });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Upload failed' });
    }
  });
}
