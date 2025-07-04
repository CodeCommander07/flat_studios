import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: 'Missing user ID' });

  await dbConnect();

  try {
    const user = await User.findById(id) // Add more fields if needed
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (err) {
    console.error('User fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
