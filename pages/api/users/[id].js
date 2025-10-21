// /api/users/[id].js
import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  try {
    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
