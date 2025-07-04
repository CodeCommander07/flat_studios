import dbConnect from '@/utils/db';
import User from '@/models/User';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, robloxUsername } = req.body;

  if (!userId || !robloxUsername) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  await dbConnect();

  try {
    const robloxRes = await axios.post(
      'https://users.roblox.com/v1/usernames/users',
      { usernames: [robloxUsername] },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const robloxUser = robloxRes.data.data[0];
    if (!robloxUser) return res.status(404).json({ message: 'Roblox user not found' });

    const avatarRes = await axios.get(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUser.id}&size=150x150&format=Png&isCircular=true`
    );

    const robloxAvatar = avatarRes.data.data[0]?.imageUrl;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        robloxId: robloxUser.id,
        robloxUsername: robloxUser.name,
        robloxAvatar,
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user: updatedUser });
  } catch (err) {
    console.error('[ROBLOX UPDATE ERROR]', err);
    res.status(500).json({ message: 'Server error' });
  }
}
