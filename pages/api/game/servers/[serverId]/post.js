import dbConnect from '@/utils/db';
import GameData from '@/models/GameData';

export default async function handler(req, res) {
  await dbConnect();

  const { serverId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, author = 'Website', type = 'normal' } = req.body;
    if (!message || !serverId)
      return res.status(400).json({ error: 'Missing message or serverId' });

    // Store message in DB for the game to fetch
    const entry = {
      playerId: 'WEB',
      username: author,
      chatMessage: message,
      type, // 'normal' | 'notification'
      createdAt: new Date(),
    };

    let server = await GameData.findOne({ serverId });
    if (!server) {
      server = await GameData.create({ serverId, players: [], chat: [entry] });
    } else {
      server.chat.push(entry);
      await server.save();
    }

    return res.status(200).json({ success: true, message: 'Sent to game' });
  } catch (err) {
    console.error('POST to game chat error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
