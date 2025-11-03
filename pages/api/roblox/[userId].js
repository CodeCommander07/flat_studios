import axios from 'axios';

const GROUP_ID = 7475597; // Yapton & District

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId || isNaN(Number(userId))) {
    return res.status(400).json({ error: 'Invalid or missing userId' });
  }

  try {
    // 1) Username
    const userRes = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
    const username = userRes.data?.name || userRes.data?.username || 'Unknown';

    // 2) Avatar
    let icon = '';
    try {
      const thumbRes = await axios.get(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot`,
        { params: { userIds: userId, size: '150x150', format: 'Png', isCircular: 'false' } }
      );
      icon = thumbRes.data?.data?.[0]?.imageUrl || '';
    } catch {}

    // 3) Group role (robust: v2 -> v1, normalize)
    let groups = [];
    try {
      const g2 = await axios.get(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
      groups = Array.isArray(g2.data?.data) ? g2.data.data : [];
    } catch {
      // fallback to v1 (returns an array)
      try {
        const g1 = await axios.get(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
        groups = Array.isArray(g1.data) ? g1.data : [];
      } catch {}
    }

    // Normalize items to { groupId:number, roleName, roleRank }
    const norm = groups.map(g => ({
      groupId: Number(g.group?.id ?? g?.groupId ?? 0),
      roleName: g.role?.name ?? g?.roleName ?? 'Guest',
      roleRank: Number(g.role?.rank ?? g?.rank ?? 0),
    }));

    const membership = norm.find(it => it.groupId === GROUP_ID);
    const rank = membership?.roleRank ?? 0;
    const role  = membership?.roleName ?? 'Guest';

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({
      userId: Number(userId),
      username,
      icon,
      group: { id: GROUP_ID, name: 'Yapton & District', rank, role },
    });
  } catch (err) {
    const status = err?.response?.status || 500;
    return res.status(status).json({
      error: 'Failed to fetch Roblox data',
      details: err?.response?.data || err?.message,
    });
  }
}
