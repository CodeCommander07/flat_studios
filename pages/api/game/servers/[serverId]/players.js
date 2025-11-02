import dbConnect from '@/utils/db';
import GameData from '@/models/GameData';

export default async function handler(req, res) {
  const { serverId } = req.query;
  if (!serverId) return res.status(400).json({ error: 'Missing serverId' });

  await dbConnect();

  // ✅ POST — game updates player list
if (req.method === 'POST') {
  const key = req.headers['x-api-key'];
  if (key !== process.env.GAME_API_KEY)
    return res.status(403).json({ error: 'Unauthorized' });
    try {
      const { players } = req.body;
      if (!Array.isArray(players)) {
        return res.status(400).json({ error: 'players must be an array' });
      }

      const updated = await GameData.findOneAndUpdate(
        { serverId },
        { $set: { players } },
        { upsert: true, new: true }
      );

      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ✅ GET — dashboard fetches player list
  if (req.method === 'GET') {
    try {
      const server = await GameData.findOne({ serverId });
      return res.status(200).json(server?.players || []);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
