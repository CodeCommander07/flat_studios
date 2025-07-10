import dbConnect from '@/utils/db';
import LeaveRequest from '@/models/LeaveRequest';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    if (req.method === 'GET') {
      const leaveRequest = await LeaveRequest.findById(id);
        return res.status(200).json(leaveRequest?.length > 0 ? leaveRequest : null);
    }
    if (req.method === 'PUT') {
      const { startDate, endDate, reason } = req.body;
      if (!startDate || !endDate || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const updated = await LeaveRequest.findByIdAndUpdate(
        id,
        { startDate, endDate, reason },
        { new: true, runValidators: true }
      );

      if (!updated) return res.status(404).json({ error: 'Leave request not found' });

      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const deleted = await LeaveRequest.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Leave request not found' });

      return res.status(204).end();
    }

    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error('Error in /api/leave/[id]:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
