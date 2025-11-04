import axios from 'axios';
import dbConnect from '@/utils/db';
import GameData from '@/models/GameData';
import cleanupGameData from '@/utils/cleanupGameData';

export default async function handler(req, res) {
  await dbConnect();

  // 🧹 Run time-based cleanup (non-blocking)
  cleanupGameData().catch((err) => console.error('Cleanup error:', err));

  try {
    // const gameId = '112732882456453'; // your Roblox place ID Test Game
    // const gameId = '5883938795'; // your Roblox place ID Yapton
    const gameId = '10568768188'; // your Roblox place ID Yapton V4
    const response = await axios.get(
      `https://games.roblox.com/v1/games/${gameId}/servers/Public?limit=100`
    );

    const liveServers = response.data?.data;
    if (!Array.isArray(liveServers)) {
      return res.status(400).json({ error: 'Unexpected Roblox API format' });
    }

    // ✅ Only build the server list — no deletions!
    const servers = liveServers.map((srv) => ({
      serverId: srv.id,
      region: srv.region || 'Unknown',
      players: srv.playing || 0,
    }));

    // 🟢 Just return live data, do NOT delete anything.
    return res.status(200).json(servers);
  } catch (err) {
    console.error('Roblox API error:', err.response?.status, err.message);
    return res.status(500).json({
      error: 'Failed to fetch servers',
      details: err.response?.data || err.message,
    });
  }
}
