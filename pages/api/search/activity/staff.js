import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    await dbConnect();

    const user = await User.findOne({ username: username.trim() }).select('_id username');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ userId: user._id.toString(), username: user.username });
  } catch (error) {
    console.error('Error searching user:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
