import dbConnect from '@/utils/db';
import Appeal from '@/models/Appeals';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 🔹 Identify user (email, Discord ID, or Roblox ID)
    const { email, discordId, robloxId } = req.query;

    if (!email && !discordId && !robloxId) {
      return res
        .status(400)
        .json({ message: 'Missing user identifier (email, DiscordId, or RobloxId)' });
    }

    // Build query dynamically depending on provided field
    const query = {};
    if (email) query.email = email;
    if (discordId) query.DiscordId = discordId;
    if (robloxId) query.RobloxId = robloxId;

    const appeals = await Appeal.find(query).sort({ createdAt: -1 }).lean();

    res.status(200).json({ appeals });
  } catch (err) {
    console.error('Error fetching appeals:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
