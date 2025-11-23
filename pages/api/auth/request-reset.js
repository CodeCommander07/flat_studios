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
    user.resetExpires = Date.now() + 1000 * 60 * 30;
    await user.save();

    const resetUrl = `${process.env.BASE_URL}/auth/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
  const html = `
  <!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <tr>
        <td style="padding: 20px; background-color: #283335; color: #ffffff;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" style="vertical-align: middle; width: 50px;">
                <img src="https://yapton.flatstudios.net/cdn/image/logo.png" alt="Yapton & District Logo" style="max-width: 50px; height: auto; margin-right: 10px;">
              </td>
              <td align="center" style="vertical-align: middle;">
                <h1 style="font-size: 24px; margin: 0; color: #ffffff;">Password Reset</h1>
              </td>
              <td style="width: 50px;"></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <p style="font-size: 18px;">Hi <strong>${user.username}</strong>,</p>
          <table cellpadding="6" cellspacing="0" width="100%" style="font-size: 16px; line-height: 1.6;">
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Reset Code</strong></td><td>${token}</td></tr>
          <tr><td><strong>Reset Link</strong></td><td><a href="${resetUrl}">${resetUrl}</a></td></tr>
          <tr><td><strong>Requested</strong></td><td>${new Date().toLocaleDateString('en-UK')}</td></tr>
          <tr><td><strong>Expires</strong></td><td>${new Date(user.resetExpires).toLocaleDateString('en-UK')}</td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 20px; background-color: #f4f4f9;">
          <p style="font-size: 14px;">Regards,<br><strong>Yapton & District Admin Team</strong></p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 10px; background-color: #f4f4f9;">
          <p style="font-size: 12px; color: #888;">This is an automated email. Yapton & District is a subsidiary of Flat Studios.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html,
    });

    res.status(200).json({ message: 'Reset link sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send reset email.' });
  }
}
