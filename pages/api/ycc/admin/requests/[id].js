// pages/api/ycc/admin/requests/[id].js
import dbConnect from '@/utils/db';
import OperatorRequest from '@/models/OperatorRequest';
import Question from '@/models/YCCRouteForm';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const request = await OperatorRequest.findById(id).lean();
      if (!request) return res.status(404).json({ success: false, message: 'Not found' });

      // Build structured on the fly if missing
      if (!request.structured && request.formData) {
        const allQuestions = await Question.find({}, '_id label page pageTitle').lean();
        const qMap = Object.fromEntries(allQuestions.map((q) => [q._id.toString(), q]));
        const grouped = {};
        for (const [qid, answer] of Object.entries(request.formData)) {
          const q = qMap[qid];
          if (!q) continue;
          const page = q.page || 1;
          const title = q.pageTitle || `Page ${page}`;
          if (!grouped[page]) grouped[page] = { title, items: [] };
          grouped[page].items.push({ label: q.label, answer });
        }
        request.structured = grouped;
      }

      res.status(200).json({ success: true, request });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { status, updatedBy } = req.body || {};
      const allowed = ['Pending', 'Approved', 'Rejected', 'Implemented'];

      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }

      if (!updatedBy) {
        return res.status(400).json({ success: false, error: 'Missing updatedBy user' });
      }

      const updated = await OperatorRequest.findByIdAndUpdate(
        id,
        {
          status,
          updatedBy,              // ✔ Save who changed it
          updatedAt: new Date()
        },
        { new: true }
      ).lean();

      if (!updated)
        return res.status(404).json({ success: false, message: 'Not found' });

      res.status(200).json({ success: true, request: updated });

    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
  else if (req.method === 'DELETE') {
    try {
      await OperatorRequest.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: 'Deleted' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
}
