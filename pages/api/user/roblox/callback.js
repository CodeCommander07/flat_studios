import User from '@/models/User';
import dbConnect from '@/utils/db';
import axios from 'axios';

export default async function handler(req, res) {
  const { code, state: userId } = req.query;


  await dbConnect();

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

    console.log('Roblox profile data:', profileRes.data);
    // 4️⃣ Update your DB
   await User.findByIdAndUpdate(
      userId,
      {
        robloxId: profileRes.data.sub,
        robloxUsername: profileRes.data.name,
        robloxAvatar: profileRes.data.picture,
      },
      { new: true }
    )

    return res.redirect('/me?refresh=1');

  } catch (err) {
    console.error('Roblox OAuth failed:', err.response?.data || err.message);
    return res.redirect('/me?error=roblox');
  }
}
