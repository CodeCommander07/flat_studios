import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (!id) return res.status(400).json({ error: 'Missing user ID' });

  try {
    const user = await User.findById(id).select('username email rank discordAvatar');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json(user);
  } catch (error) {
    console.error('[get-user]', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}
