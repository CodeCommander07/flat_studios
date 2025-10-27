import dbConnect from '@/utils/db';
import OperatorSubmission from '@/models/Operators'

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  switch (req.method) {
    case 'GET': {
      const submission = await OperatorSubmission.findById(id);
      if (!submission) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ submission });
    }

    case 'PUT': {
      try {
        const updated = await OperatorSubmission.findByIdAndUpdate(id, req.body, { new: true });
        return res.status(200).json({ success: true, updated });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    case 'DELETE': {
      try {
        await OperatorSubmission.findByIdAndDelete(id);
        return res.status(200).json({ success: true });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
