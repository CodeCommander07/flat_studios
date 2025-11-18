import dbConnect from '@/utils/db';
import ModerationLog from '@/models/ModerationLog';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const log = await ModerationLog.create({
        action: req.body.action,
        targetId: req.body.targetId,
        targetName: req.body.targetName,
        moderatorId: req.body.moderatorId,
        moderatorName: req.body.moderatorName,
        serverId: req.body.serverId,
        scope: req.body.scope,
        reason: req.body.reason,
        banType: req.body.banType,
        expiresAt: req.body.expiresAt || undefined,
        rawResponse: req.body.rawResponse || undefined,
      });

      return res.status(200).json({ success: true, log });
    } catch (err) {
      console.error('Failed to create moderation log:', err);
      return res
        .status(500)
        .json({ success: false, error: 'Failed to create moderation log' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { serverId } = req.query;

      const query = {};
      if (serverId) query.serverId = serverId;

      const logs = await ModerationLog.find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      return res.status(200).json({ success: true, logs });
    } catch (err) {
      console.error('Failed to fetch moderation logs:', err);
      return res
        .status(500)
        .json({ success: false, error: 'Failed to fetch moderation logs' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
