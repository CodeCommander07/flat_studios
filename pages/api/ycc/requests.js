import dbConnect from '@/utils/db';
import OperatorRequest from '@/models/OperatorRequest';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Exclude mapFile from the results to avoid huge JSON responses
    const requests = await OperatorRequest.find({}, { mapFile: 0 }).sort({ createdAt: -1 }).lean();

    res.status(200).json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
