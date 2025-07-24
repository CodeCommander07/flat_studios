import dbConnect from '@/utils/db';
import StaffNotices from '@/models/StaffNotices';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Fetch all notices, sorted newest first
    const notices = await StaffNotices.find().sort({ date: -1 });

    res.status(200).json({ notices });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}