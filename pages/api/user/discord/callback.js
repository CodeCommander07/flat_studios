import axios from 'axios';

export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) return res.redirect('/dashboard');

  try {
    // 1. Exchange code for access token
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

    // 2. Fetch Discord user info
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const discordUser = userRes.data;

    // 3. Format avatar URL
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    // 4. Save to localStorage via redirect with data in query
 const userId = req.query.state;
await axios.post(`${process.env.BASE_URL}/api/user/discord/update`, {
  userId,
  discordId: discordUser.id,
  discordUsername: `${discordUser.username}`,
  discordAvatar: `${avatarUrl}`,
});
    res.redirect(`/me/`);
  } catch (err) {
    console.error('OAuth failed:', err.message);
    res.redirect('/me/');
  }
}
