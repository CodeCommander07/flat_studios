import GameData from '@/models/GameData';
import dbConnect from '@/utils/db';

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  if (req.method === 'POST') {
    try {
      const server = await GameData.findOne({ serverId });
      if (!server) return res.status(404).json({ error: 'Server not found' });

      server.flagged = true;
      server.flaggedAt = new Date();
      await server.save();

      return res.status(200).json({ success: true, message: 'Server flagged successfully' });
    } catch (err) {
      console.error('Error flagging server:', err);
      return res.status(500).json({ error: 'Failed to flag server' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
