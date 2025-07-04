import dbConnect from '@/utils/db';
import LeaveRequest from '@/models/LeaveRequest';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const {userId, reason, startDate, endDate } = req.body;

    if (!userId || !reason || !startDate || !endDate) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
      const leave = new LeaveRequest({ userId, reason, startDate, endDate, status: 'Pending' });
      await leave.save();
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save leave request.' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
