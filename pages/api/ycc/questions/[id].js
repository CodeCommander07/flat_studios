import dbConnect from '@/utils/db';
import Question from '@/models/YCCRouteForm';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  try {
    if (req.method === 'PUT') {
      const updated = await Question.findByIdAndUpdate(id, req.body, { new: true });
      return res.status(200).json({ success: true, question: updated });
    }

    if (req.method === 'DELETE') {
      await Question.findByIdAndDelete(id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
