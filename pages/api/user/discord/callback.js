import axios from 'axios';

export default async function handler(req, res) {
  const code = req.query.code;
  const userId = req.query.state;

  if (!code || !userId) return res.redirect('/me');

  try {
    // 1️⃣ Exchange code for access token
    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // 2️⃣ Get Discord user info
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const discordUser = userRes.data;

    // 3️⃣ Build avatar URL
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    // 4️⃣ Update user record
    await axios.post(`${process.env.BASE_URL}/api/user/discord/update`, {
      userId,
      discordId: discordUser.id,
      discordUsername: discordUser.username,
      discordAvatar: avatarUrl,
    });

    // 5️⃣ Redirect back to profile with ?refresh=1
    res.redirect('/me?refresh=1');
  } catch (err) {
    console.error('Discord OAuth failed:', err.response?.data || err.message);
    res.redirect('/me?error=discord');
  }
}
