import dbConnect from '@/utils/db';
import OperatorSubmission from '@/models/Operators'

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'GET': {
      const submissions = await OperatorSubmission.find();
      return res.status(200).json({ submissions });
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
