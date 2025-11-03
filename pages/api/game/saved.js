import dbConnect from '@/utils/db';
import GameData from '@/models/GameData';

export default async function handler(req, res) {
  await dbConnect();

  try {
    // Only include servers that have chat logs or players — i.e. “saved sessions”
    const savedServers = await GameData.find({})
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json(savedServers);
  } catch (err) {
    console.error('Error fetching saved servers:', err);
    return res.status(500).json({ error: 'Failed to fetch saved servers' });
  }
}
