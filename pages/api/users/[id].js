// /api/users/[id].js
import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  try {
    const user = await User.findById(id).lean();
    if (!user)
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });

    return res.status(200).json({
      success: true,
      user
    });

  } catch (err) {
    console.error("User lookup failed:", err);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}
