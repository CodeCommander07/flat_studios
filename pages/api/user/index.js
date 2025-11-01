import dbConnect from '@/utils/db';
import User from '@/models/User';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: 'Missing id' });

  try {
    // ✅ Ensure id is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ user });
  } catch (err) {
    console.error('Error fetching user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
