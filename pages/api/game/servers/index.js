import axios from 'axios';
import dbConnect from '@/utils/db';
import GameData from '@/models/GameData';
import cleanupGameData from '@/utils/cleanupGameData';

export default async function handler(req, res) {
  await dbConnect();

  // 🔁 Run cleanup on every call (non-blocking)
  cleanupGameData().catch((err) => console.error('Cleanup error:', err));

  try {
    const gameId = '112732882456453'; // your Roblox place ID
    const response = await axios.get(
      `https://games.roblox.com/v1/games/${gameId}/servers/Public?limit=100`
    );

    const liveServers = response.data?.data;
    if (!Array.isArray(liveServers)) {
      return res.status(400).json({ error: 'Unexpected Roblox API format' });
    }

    const servers = liveServers.map((srv) => ({
      serverId: srv.id,
      region: srv.region || 'Unknown',
      players: srv.playing || 0,
    }));

    const liveServerIds = servers.map((s) => s.serverId);

    // 🗑️ Delete stale GameData entries not in Roblox’s live list
    const stale = await GameData.find({
      serverId: { $nin: liveServerIds },
    });

    if (stale.length > 0) {
      const ids = stale.map((s) => s.serverId);
      await GameData.deleteMany({ serverId: { $in: ids } });
      console.log(`🗑️ Removed ${ids.length} old server records`, ids);
    }

    return res.status(200).json(servers);
  } catch (err) {
    console.error('Roblox API error:', err.response?.status, err.message);
    return res.status(500).json({
      error: 'Failed to fetch servers',
      details: err.response?.data || err.message,
    });
  }
}
