import dbConnect from '@/utils/db';
import SubmittedApplication from '@/models/SubmittedApplication';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 🔹 Determine user (adjust depending on your auth system)
    const email =
      req.query.email ||
      req.headers['x-user-email'] ||
      req.body?.email ||
      null;

    if (!email) {
      return res.status(400).json({ message: 'Missing user email' });
    }

    const applications = await SubmittedApplication.find({ applicantEmail: email })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ applications });
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
