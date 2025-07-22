import dbConnect from '@/utils/db';
import User from '@/models/User';
import { hashPassword } from '@/utils/auth';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email, code, and new password are required' });
  }

  try {

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashed = await hashPassword(newPassword);
    user.password = hashed;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
