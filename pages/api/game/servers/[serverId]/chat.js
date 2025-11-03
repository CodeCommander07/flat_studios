import dbConnect from '@/utils/db';
import GameData from '@/models/GameData';

export default async function handler(req, res) {
  const { serverId } = req.query;
  await dbConnect();

  try {
    if (req.method === 'POST') {
      const { playerId, username, chatMessage, time } = req.body;
      const chatEntry = { playerId, username, chatMessage, time };

      const server = await GameData.findOneAndUpdate(
        { serverId },
        { $push: { chat: chatEntry } },
        { upsert: true, new: true }
      );

      return res.status(200).json({ success: true, data: server.chat });
    }

    if (req.method === 'GET') {
      const server = await GameData.findOne({ serverId });
      return res.status(200).json(server?.chat || []);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
