import dbConnect from '@/utils/db';
import ActivityLog from '@/models/ActivityLog';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const logs = await ActivityLog.find({userId:id}).sort({ date: -1 });

    return res.status(200).json(logs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
}
