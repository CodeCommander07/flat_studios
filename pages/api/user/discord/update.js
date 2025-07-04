import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, discordId, discordUsername, discordAvatar } = req.body;

  if (!userId || !discordId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  console.log('Updating Discord for user:', userId, discordId, discordUsername, discordAvatar);

  await dbConnect();

  try {
    const updated = await User.findByIdAndUpdate(
      {_id: userId},
      {
        discordId,
        discordUsername,
        discordAvatar,
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'User not found' });
    console.log('Discord updated:', updated);
    res.status(200).json({ message: 'Discord connected', user: updated });
  } catch (err) {
    console.error('[DISCORD UPDATE ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
}
