import dbConnect from '@/utils/db';
import GameData from '@/models/GameData';

export default async function handler(req, res) {
  const { serverId } = req.query;
  await dbConnect();

  try {
    if (req.method === 'POST') {
      const { players, action, playerId, username, joined, left } = req.body;

      let server = await GameData.findOne({ serverId });
      if (!server) server = await GameData.create({ serverId, players: [], chat: [] });

      if (players) {
        // Full list update
        server.players = players;
      } else if (action === 'join') {
        // Add joined record
        server.players.push({ playerId, username, joined, left: null });
      } else if (action === 'leave') {
        // Update player's leave time
        const player = server.players.find((p) => p.playerId === playerId);
        if (player) player.left = left;
      }

      await server.save();
      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      const server = await GameData.findOne({ serverId });
      return res.status(200).json(server?.players || []);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
