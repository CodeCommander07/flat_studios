// pages/api/roblox/stats.js
import axios from 'axios';

export default async function handler(req, res) {
  const UNIVERSE_ID = '2103484249';

  try {
    const response = await axios.get(
      `https://games.roblox.com/v1/games?universeIds=${UNIVERSE_ID}`
    );
    res.status(200).json(response.data.data[0]); // send only the game object
  } catch (error) {
    console.error('Failed to fetch Roblox stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from Roblox' });
  }
}
