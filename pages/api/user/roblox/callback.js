import axios from 'axios';

export default async function handler(req, res) {
  const code = req.query.code;
  const userId = req.query.state;

  if (!code || !userId) return res.redirect('/me/');

  try {
    // 1. Exchange code for tokens
    const tokenRes = await axios.post(
      'https://apis.roblox.com/oauth/v1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.BASE_URL}/api/user/roblox/callback`,
        client_id: process.env.ROBLOX_CLIENT_ID,
        client_secret: process.env.ROBLOX_CLIENT_SECRET,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { id_token } = tokenRes.data;

    if (!id_token) throw new Error('No ID token returned by Roblox');

    // 2. Decode JWT (without verifying signature)
    const [header, payload] = id_token.split('.').slice(0, 2).map(str => Buffer.from(str, 'base64url').toString());
    const claims = JSON.parse(payload);

    // 3. Extract Roblox user info
    const robloxId = claims.sub;
    const username = claims.preferred_username || claims.nickname || claims.name;
    const avatar = claims.picture || null;

    // 4. Update user in DB (replace URL with your API route)
    await axios.post(`${process.env.BASE_URL}/api/user/roblox/update`, {
      userId,
      robloxId,
      robloxUsername: username,
      robloxAvatar: avatar,
    });

    // 5. Redirect to profile
    res.redirect(`/me`);
  } catch (err) {
    console.error('Roblox OAuth failed:', err.message);
    res.redirect('/me');
  }
}
