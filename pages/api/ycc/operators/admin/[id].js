import dbConnect from '@/utils/db';
import OperatorSubmission from '@/models/Operators';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  switch (req.method) {
    // 🔹 GET single operator
    case 'GET': {
      try {
        const submission = await OperatorSubmission.findById(id);
        if (!submission) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json({ success: true, submission });
      } catch (err) {
        return res.status(400).json({ error: 'Invalid ID or query' });
      }
    }

    // 🔹 PUT (update existing operator)
    case 'PUT': {
      try {
        const updateData = req.body; // expects JSON body with logo URL, etc.
        const updated = await OperatorSubmission.findByIdAndUpdate(id, updateData, {
          new: true,
        });
        if (!updated) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json({ success: true, updated });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    // 🔹 DELETE
    case 'DELETE': {
      try {
        const deleted = await OperatorSubmission.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json({ success: true });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
