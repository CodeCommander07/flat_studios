import dbConnect from '@/utils/db';
import OperatorSubmission from '@/models/Operators'

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'GET': {
      const submissions = await OperatorSubmission.find().sort({ createdAt: -1 });
      return res.status(200).json({ submissions });
    }

    case 'POST': {
      try {
        const submission = await OperatorSubmission.create(req.body);
        return res.status(201).json({ success: true, submission });
      } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
    }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
