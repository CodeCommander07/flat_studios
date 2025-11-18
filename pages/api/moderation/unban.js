import axios from 'axios';
import dbConnect from '@/utils/db';
import ModerationLog from '@/models/ModerationLog';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { robloxUserId, reason, moderatorId, moderatorName, serverId } =
    req.body || {};

  if (!robloxUserId) {
    return res
      .status(400)
      .json({ success: false, error: 'robloxUserId is required' });
  }

  const apiKey = process.env.ROBLOX_API_KEY;
  const universeId = process.env.ROBLOX_UNIVERSE_ID || '2103484249';

  if (!apiKey) {
    return res
      .status(500)
      .json({ success: false, error: 'ROBLOX_API_KEY is not configured' });
  }

  const url = `https://apis.roblox.com/cloud/v2/universes/${universeId}/user-restrictions/${robloxUserId}?updateMask=gameJoinRestriction`;

  const body = {
    gameJoinRestriction: {
      active: false,
    },
  };

  try {
    const robloxRes = await axios.patch(url, body, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    await dbConnect();

    const log = await ModerationLog.create({
      action: 'unban',
      targetId: String(robloxUserId),
      targetName: null,
      moderatorId: moderatorId || null,
      moderatorName: moderatorName || null,
      serverId: serverId || null,
      scope: 'global',
      reason: reason || 'Unbanned via web dashboard',
      rawResponse: robloxRes.data,
    });

    return res.status(200).json({ success: true, roblox: robloxRes.data, log });
  } catch (err) {
    console.error('Roblox Unban API error:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to unban user',
      details: err.response?.data || err.message,
    });
  }
}
