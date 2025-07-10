// pages/api/leave/all.js
import dbConnect from '@/utils/db';
import LeaveRequest from '@/models/LeaveRequest';
import User from '@/models/User'; // optional if you want user info

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const leaves = await LeaveRequest.find().populate('userId', 'username email');
    return res.status(200).json(leaves);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
}
