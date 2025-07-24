import dbConnect from '@/utils/db';
import UserFile from '@/models/UserFile';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  await dbConnect();

  try {
    const files = await UserFile.find({ userId }).select('_id filename createdAt').sort({ createdAt: -1 });
    res.status(200).json({ files });
  } catch (err) {
    console.error('List files error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
