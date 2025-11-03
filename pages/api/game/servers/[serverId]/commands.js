import dbConnect from '@/utils/db';
import GameCommand from '@/models/GameCommand';

export default async function handler(req, res) {
  const { serverId } = req.query;
  await dbConnect();

  if (req.method === 'POST') {
    const { type, targetId, reason, issuedBy } = req.body;
    if (!type || !targetId)
      return res.status(400).json({ error: 'Missing type or targetId' });

    await GameCommand.create({
      serverId,
      type,
      targetId,
      reason: reason || 'No reason provided',
      issuedBy,
      executed: false,
    });

    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const commands = await GameCommand.find({ serverId, executed: false });

    // Mark all as executed after sending
    for (const cmd of commands) {
      cmd.executed = true;
      await cmd.save();
    }

    return res.status(200).json(commands);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
