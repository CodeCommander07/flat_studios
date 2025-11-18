import axios from 'axios';
import dbConnect from '@/utils/db';
import ModerationLog from '@/models/ModerationLog';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' });

  const {
    robloxUserId,
    scope, // 'global'
    type, // 'permanent' | 'temporary'
    durationMinutes,
    reason,
    moderatorId,
    moderatorName,
    serverId,
  } = req.body || {};

  if (!robloxUserId || !scope || !type || !reason) {
    return res.status(400).json({
      success: false,
      error: 'robloxUserId, scope, type and reason are required',
    });
  }

  if (scope !== 'global') {
    return res.status(400).json({
      success: false,
      error: 'This endpoint only handles global bans via Roblox API',
    });
  }

  const apiKey = process.env.ROBLOX_API_KEY;
  const universeId = process.env.ROBLOX_UNIVERSE_ID || '2103484249';

  if (!apiKey) {
    return res
      .status(500)
      .json({ success: false, error: 'ROBLOX_API_KEY is not configured' });
  }

  const url = `https://apis.roblox.com/cloud/v2/universes/${universeId}/user-restrictions/${robloxUserId}?updateMask=gameJoinRestriction`;

  const now = new Date();
  let expireTime = null;
  if (type === 'temporary') {
    const minutes = Number(durationMinutes) || 60;
    const expireDate = new Date(now.getTime() + minutes * 60 * 1000);
    expireTime = expireDate.toISOString();
  }

  const body = {
    gameJoinRestriction: {
      active: true,
      ...(expireTime && { expireTime }),
      metadata: {
        reason: reason.slice(0, 250),
        source: 'Yapton Web Dashboard',
      },
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
      action: 'ban',
      targetId: String(robloxUserId),
      targetName: null,
      moderatorId: moderatorId || null,
      moderatorName: moderatorName || null,
      serverId: serverId || null,
      scope: 'global',
      reason,
      banType: type,
      ...(expireTime && { expiresAt: new Date(expireTime) }),
      rawResponse: robloxRes.data,
    });

    return res.status(200).json({ success: true, roblox: robloxRes.data, log });
  } catch (err) {
    console.error('Roblox Ban API error:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to apply Roblox global ban',
      details: err.response?.data || err.message,
    });
  }
}
