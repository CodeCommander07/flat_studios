import dbConnect from '@/utils/db';
import GameData from '@/models/GameData';

export default async function handler(req, res) {
  const { serverId } = req.query;
  await dbConnect();

  try {
    let server = await GameData.findOne({ serverId });
    if (!server) server = await GameData.create({ serverId, players: [], chat: [] });

    const now = new Date();

    if (req.method === 'POST') {
      const { players, action, playerId, joined, left } = req.body;

      if (Array.isArray(players)) {
        const liveIds = players.map((p) => String(p.playerId));

        // Add or update active players
        for (const p of players) {
          const id = String(p.playerId);
          let existing = server.players.find((pl) => String(pl.playerId) === id);

          if (!existing) {
            server.players.push({
              playerId: id,
              joined: p.joined ? new Date(p.joined) : now,
              left: null,
            });
          } else {
            if (!existing.joined) existing.joined = now;
            existing.left = null;
          }
        }

        // Mark absent players as left
        for (const pl of server.players) {
          if (!liveIds.includes(String(pl.playerId)) && !pl.left) {
            pl.left = now;
          }
        }
      }

      // Individual join/leave
      else if (action === 'join') {
        const id = String(playerId);
        let existing = server.players.find((p) => String(p.playerId) === id);
        if (!existing) {
          server.players.push({
            playerId: id,
            joined: joined ? new Date(joined) : now,
            left: null,
          });
        } else {
          existing.left = null;
          if (!existing.joined) existing.joined = now;
        }
      } else if (action === 'leave') {
        const id = String(playerId);
        const existing = server.players.find((p) => String(p.playerId) === id);
        if (existing && !existing.left) {
          existing.left = left ? new Date(left) : now;
        }
      }

      await server.save();
      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      const players = (server.players || []).sort(
        (a, b) => new Date(b.joined || 0) - new Date(a.joined || 0)
      );
      return res.status(200).json(players);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Player API Error:', err);
    res.status(500).json({ error: err.message });
  }
}
