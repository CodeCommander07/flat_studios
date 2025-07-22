import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  const { id, status } = req.query;

  if (!id) return res.status(400).json({ message: 'Missing user ID' });

  await dbConnect();

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.method === 'GET') {
      return res.status(200).json(user);
    }

    if (req.method === 'PUT') {
      if (status === 'edit') {
        const { username, email, newsletter } = req.body;

        if (username) user.username = username;
        if (email) user.email = email;
        if (newsletter !== undefined) user.newsletter = newsletter;

        await user.save();
        return res.status(200).json({ message: 'User updated', user });
      }

      if (status === 'avatar') {
        const { defaultAvatar } = req.body;
        if (defaultAvatar) {
          user.defaultAvatar = defaultAvatar;
          await user.save();
          return res.status(200).json({ message: 'Avatar updated', user });
        } else {
          return res.status(400).json({ message: 'Missing avatar URL' });
        }
      }

      return res.status(400).json({ message: 'Invalid status parameter' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (err) {
    console.error('User API error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
