import GameData from '@/models/GameData';
import dbConnect from '@/utils/db';

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  // 🚫 Prevent Roblox POST from flagging or modifying anything beyond chat
  if (req.method === 'POST') {
    const { playerId, chatMessage } = req.body;

    if (!playerId || !chatMessage) {
      return res.status(400).json({ error: 'Missing playerId or chatMessage' });
    }

    try {
      // Find or create GameData record for this server
      let serverData = await GameData.findOne({ serverId });
      if (!serverData) {
        serverData = new GameData({ serverId, players: [], chat: [] });
      }

      // Append the chat log
      serverData.chat.push({
        playerId,
        chatMessage,
        time: new Date(),
      });

      await serverData.save();
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error saving chat:', err);
      return res.status(500).json({ success: false, error: 'Failed to save chat log' });
    }
  }

  // 🧩 Fetch chat logs
  if (req.method === 'GET') {
    try {
      const serverData = await GameData.findOne({ serverId });
      if (!serverData) {
        return res.status(404).json({ error: 'Server not found' });
      }
      return res.status(200).json(serverData.chat || []);
    } catch (err) {
      console.error('Error fetching chat logs:', err);
      return res.status(500).json({ error: 'Failed to fetch chat logs' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
