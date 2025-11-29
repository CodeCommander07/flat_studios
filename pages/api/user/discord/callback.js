import axios from 'axios';

export default async function handler(req, res) {
  const { code, state: userId } = req.query;

  if (!code || !userId) return res.redirect('/me');

  try {
    // 1️⃣ Exchange code for token
    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenRes.data.access_token;

    // 2️⃣ Fetch Discord user info
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const discordUser = userRes.data;
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    // 3️⃣ Update the user record
    await axios.post(`${process.env.LIVE_URL}/api/user/discord/update`, {
      userId,
      discordId: discordUser.id,
      discordUsername: discordUser.username,
      discordAvatar: avatarUrl,
    });

    // 4️⃣ Redirect to profile with refresh flag
    return res.redirect('/me?refresh=1');
  } catch (err) {
    console.error('Discord OAuth failed:', err.response?.data || err.message);
    return res.redirect('/me?error=discord');
  }
}
