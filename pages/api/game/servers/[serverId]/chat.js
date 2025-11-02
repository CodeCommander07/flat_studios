import dbConnect from '@/utils/db';
import GameData from '@/models/GameData';

export default async function handler(req, res) {
  const { serverId } = req.query;
  if (!serverId) return res.status(400).json({ error: 'Missing serverId' });

  await dbConnect();

  // ✅ POST — game sends message
  if (req.method === 'POST') {
  const key = req.headers['x-api-key'];
  if (key !== process.env.GAME_API_KEY)
    return res.status(403).json({ error: 'Unauthorized' });

    try {
      const { playerId, username, chatMessage } = req.body;
      if (!playerId || !chatMessage)
        return res.status(400).json({ error: 'Missing playerId or chatMessage' });

      const server = await GameData.findOneAndUpdate(
        { serverId },
        {
          $push: {
            chat: { playerId, username, chatMessage, time: new Date() },
          },
        },
        { upsert: true, new: true }
      );

      // Keep chat limited to last 100
      if (server.chat.length > 100) {
        server.chat = server.chat.slice(-100);
        await server.save();
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ✅ GET — dashboard fetches chat logs
  if (req.method === 'GET') {
    try {
      const server = await GameData.findOne({ serverId });
      return res.status(200).json(server?.chat || []);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
