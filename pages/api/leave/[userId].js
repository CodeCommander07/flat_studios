import dbConnect from '@/utils/db';
import LeaveRequest from '@/models/LeaveRequest';

export default async function handler(req, res) {
  await dbConnect();

  const { userId } = req.query;

  if (req.method === 'GET') {
    const leaves = await LeaveRequest.find({ userId });
    res.status(200).json(leaves);
  } else {
    res.status(405).end();
  }
}