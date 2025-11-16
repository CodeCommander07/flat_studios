import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();

  const { username } = req.query;

  if (!username || username.trim().length === 0) {
    return res.status(400).json({ available: false, error: "No username provided" });
  }

  try {
    const existing = await User.findOne({ username: username.trim() }).lean();

    return res.status(200).json({
      available: !existing,
    });

  } catch (err) {
    console.error("Username check error:", err);
    return res.status(500).json({ available: false, error: err.message });
  }
}
