import dbConnect from '@/utils/db';
import UserFile from '@/models/UserFile';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { fileId, userId } = req.query;
  if (!fileId || !userId) return res.status(400).json({ error: 'Missing fileId or userId' });

  await dbConnect();

  try {
    const file = await UserFile.findOne({ _id: fileId, userId });
    if (!file) return res.status(404).json({ error: 'File not found' });

    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', file.mimetype);
    res.send(file.data);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
