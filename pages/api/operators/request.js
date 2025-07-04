import dbConnect from '@/utils/db';
import OperatorSubmission from '@/models/OperatorSubmission';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    await dbConnect();

    const data = req.body;
    const submission = new OperatorSubmission(data);
    await submission.save();    

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Submission failed:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
