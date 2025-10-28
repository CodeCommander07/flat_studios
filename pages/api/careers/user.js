import dbConnect from '@/utils/db';
import SubmittedApplication from '@/models/SubmittedApplication';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Missing email parameter' });
    }

    // ✅ Populate the applicationId reference to include title
    const applications = await SubmittedApplication.find({ applicantEmail: email })
      .populate({
        path: 'applicationId',
        select: 'title department open', // pull any fields you want
      })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ applications });
  } catch (err) {
    console.error('Error fetching user applications:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
