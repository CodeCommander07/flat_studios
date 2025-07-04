// pages/api/admin/stats.js
import connectDB from '@/utils/db';
import User from '@/models/User';
import Appeals from '@/models/Appeals';

export default async function handler(req, res) {
  await connectDB();

  try {
const staffCount = await User.countDocuments({ role: { $ne: 'User' } });
    const appeals = await Appeals.countDocuments({ status: { $in: 'Pending' } });


    res.status(200).json({ staffCount, appeals });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
}
