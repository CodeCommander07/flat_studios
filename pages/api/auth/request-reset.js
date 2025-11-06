import dbConnect from '@/utils/db';
import User from '@/models/User';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ message: 'Method not allowed' });

  await dbConnect();
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If the account exists, email sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetExpires = Date.now() + 1000 * 60 * 30; // 30 min expiry
    await user.save();

    const resetUrl = `${process.env.BASE_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>Hello ${user.username || ''},</p>
        <p>You requested a password reset. Click below to set a new password:</p>
        <a href="${resetUrl}" style="color:#2563eb;">Reset Password</a>
        <p>This link expires in 30 minutes.</p>
      `,
    });

    res.status(200).json({ message: 'Reset link sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send reset email.' });
  }
}
