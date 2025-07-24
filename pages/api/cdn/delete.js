import dbConnect from '@/utils/db';
import UserFile from '@/models/UserFile';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, fileId } = req.body;
  if (!userId || !fileId) return res.status(400).json({ error: 'Missing userId or fileId' });

  await dbConnect();

  try {
    const deleted = await UserFile.deleteOne({ _id: fileId, userId });
    if (deleted.deletedCount === 0) return res.status(404).json({ error: 'File not found' });

    res.status(200).json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
