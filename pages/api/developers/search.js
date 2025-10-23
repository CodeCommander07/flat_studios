import dbConnect from '@/utils/db';
import User from '@/models/User'; // adjust path to your User model

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ message: 'Query too short' });
  }

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { discordUsername: { $regex: q, $options: 'i' } },
        { robloxUsername: { $regex: q, $options: 'i' } },
        { userId: { $regex: q, $options: 'i' } },
      ],
    })
      .select('discordUsername robloxUsername defaultAvatar userId')
      .limit(10);

    return res.status(200).json(users);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
