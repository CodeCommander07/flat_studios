import dbConnect from '@/utils/db';
import ActivityLog from '@/models/ActivityLog';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const logs = await ActivityLog.find()
      return res.status(200).json(logs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return res.status(500).json({ message: 'Error fetching logs' });
    }
  }
}