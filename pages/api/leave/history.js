import dbConnect from '@/utils/db';
import LeaveRequest from '@/models/LeaveRequest';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const {userId} = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
      const leaves = await LeaveRequest.find({userId})
      return res.status(200).json(leaves);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save leave request.' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
