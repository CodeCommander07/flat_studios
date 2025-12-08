import axios from 'axios';

export default async function handler(req, res) {
  const { code, state: userId } = req.query;

  if (!code || !userId) return res.redirect('/me');

  try {
    // 1️⃣ Exchange code for access token
    const tokenRes = await axios.post(
      'https://apis.roblox.com/oauth/v1/token',
      new URLSearchParams({
        client_id: process.env.ROBLOX_CLIENT_ID,
        client_secret: process.env.ROBLOX_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.ROBLOX_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenRes.data.access_token;

    // 2️⃣ Get Roblox user info
    const profileRes = await axios.get(
      'https://apis.roblox.com/oauth/v1/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const roblox = profileRes.data;
    const robloxId = roblox.sub;

    // 3️⃣ Fetch avatar via official Avatar API
    const avatarRes = await axios.get(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=420x420&format=Png&isCircular=false`
    );

    let avatarUrl =
      avatarRes.data?.data?.[0]?.imageUrl ||
      `https://www.roblox.com/headshot-thumbnail/image?userId=${robloxId}&width=420&height=420&format=png`;

    // 4️⃣ Update your DB
    await axios.post(`${process.env.LIVE_URL}/api/user/roblox/update`, {
      userId,
      robloxId,
      robloxUsername: roblox.name || roblox.nickname,
      robloxAvatar: avatarUrl,
    });

    return res.redirect('/me?refresh=1');

  } catch (err) {
    console.error('Roblox OAuth failed:', err.response?.data || err.message);
    return res.redirect('/me?error=roblox');
  }
}
