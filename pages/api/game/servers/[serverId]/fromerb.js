import dbConnect from '@/utils/db';
import GameData from '@/models/GameData';

export default async function handler(req, res) {
  await dbConnect();

  const { serverId } = req.query;
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const server = await GameData.findOne({ serverId });
    if (!server) return res.status(200).json([]);

    // Only return website-originated messages
    const fromWeb = (server.chat || []).filter((c) => c.playerId === 'WEB');

    // Optionally clear them after sending (so they don’t resend)
    server.chat = (server.chat || []).filter((c) => c.playerId !== 'WEB');
    await server.save();

    return res.status(200).json(fromWeb);
  } catch (err) {
    console.error('Fetch fromweb error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}
