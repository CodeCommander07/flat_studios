import dbConnect from '@/utils/db';
import Question from '@/models/YCCRouteForm';

export default async function handler(req, res) {
  await dbConnect();

  try {
    if (req.method === 'GET') {
      const questions = await Question.find().sort({ page: 1, order: 1 });
      return res.status(200).json({ success: true, questions });
    }

    if (req.method === 'POST') {
      const newQ = await Question.create(req.body);
      return res.status(201).json({ success: true, question: newQ });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
