// pages/api/ycc/admin/operator-requests/[id].js
import dbConnect from '@/utils/db';
import OperatorApplication from '@/models/OperatorSubmission';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const request = await OperatorApplication.findById(id).lean();
      if (!request) return res.status(404).json({ success: false, error: 'Not found' });
      res.status(200).json({ success: true, request });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { status } = req.body || {};
      const allowed = ['Pending', 'Approved', 'Rejected', 'Implemented'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }
      const updated = await OperatorApplication.findByIdAndUpdate(
        id, { status }, { new: true }
      ).lean();
      if (!updated) return res.status(404).json({ success: false, error: 'Not found' });
      res.status(200).json({ success: true, request: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await OperatorApplication.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: 'Deleted' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
}
