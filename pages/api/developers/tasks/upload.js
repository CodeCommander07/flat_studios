// pages/api/developers/tasks/upload.js
import dbConnect from '@/utils/db';
import DeveloperTasks from '@/models/DeveloperTasks';
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  await dbConnect();

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const { taskId } = fields;
    if (!taskId) return res.status(400).json({ error: 'Missing taskId' });

    const uploadedFile = files.file;
    if (!uploadedFile) return res.status(400).json({ error: 'No file uploaded' });

    // Sometimes formidable gives array if multiples: true
    const fileObj = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

    try {
      const fileBuffer = await fs.readFile(fileObj.filepath || fileObj.filepath || fileObj.file); // safest

      const updated = await DeveloperTasks.findOneAndUpdate(
        { 'tasks.taskId': taskId },
        {
          $push: {
            'tasks.$.files': {
              filename: fileObj.originalFilename || fileObj.newFilename,
              data: fileBuffer,
              contentType: fileObj.mimetype,
              size: fileObj.size,
            },
          },
        },
        { new: true }
      );

      if (!updated) return res.status(404).json({ error: 'Task not found' });

      res.status(200).json({ message: 'File uploaded', files: updated.tasks[0].files });
    } catch (e) {
      console.error('File read error:', e);
      res.status(500).json({ error: 'Failed to read file' });
    }
  });
}
