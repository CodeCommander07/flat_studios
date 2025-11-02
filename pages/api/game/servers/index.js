// pages/api/game/servers.js
import axios from 'axios';

export default async function handler(req, res) {
  try {
    const gameId = '112732882456453'; // ← your Roblox place ID
    const response = await axios.get(
      `https://games.roblox.com/v1/games/${gameId}/servers/Public?limit=10`
    );

    // Roblox returns { data: [ {id, region, playing, ...}, ... ] }
    if (!response.data || !Array.isArray(response.data.data)) {
      return res.status(400).json({ error: 'Unexpected Roblox API format' });
    }

    const servers = response.data.data.map((srv) => ({
      serverId: srv.id,
      region: srv.region || 'Unknown',
      players: srv.playing || 0,
    }));

    return res.status(200).json(servers);
  } catch (err) {
    console.error('Roblox API error:', err.response?.status, err.message);
    return res.status(500).json({
      error: 'Failed to fetch servers',
      details: err.response?.data || err.message,
    });
  }
}
