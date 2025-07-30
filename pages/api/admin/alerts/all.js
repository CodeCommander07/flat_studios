// /api/admin/alerts/all.js
import dbConnect from '@/utils/db';
import StaffNotices from '@/models/StaffNotices';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const notices = await StaffNotices.find();
    res.status(200).json({ notices });
  } catch (error) {
    console.error('Error fetching all alerts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
