import dbConnect from '@/utils/db';
import User from '@/models/User';
import PasswordReset from '@/models/PasswordReset';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const mailer = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  secure: true, 
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate a 6-digit reset code
    const code = crypto.randomInt(100000, 999999).toString();

    // Remove any existing reset codes for this user
    await PasswordReset.deleteMany({ email });

    // Save the new code
    await PasswordReset.create({
      email,
      code,
    });

    let to = email;
    await mailer.sendMail({
      from: 'Flat Studios <notifications@flatstudios.net>',
      to,
      subject: `Password Reset`,
html: `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <tr>
        <td style="padding: 20px; background-color: #283335; color: #ffffff;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" style="vertical-align: middle; width: 50px;">
                <Image src="https://yapton.vercel.app/cdn/image/logo.png" alt="Yapton & District Logo" style="max-width: 50px; height: auto; margin-right: 10px;">
              </td>
              <td align="center" style="vertical-align: middle;">
                <h1 style="font-size: 24px; margin: 0; color: #ffffff;">Reset Your Password</h1>
              </td>
              <td style="width: 50px;"></td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding: 20px;">
          <p style="font-size: 18px;">Hello <strong>${user.username || 'User'}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">
            You requested to reset your password. Use the code below to proceed:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <p style="
              font-size: 24px;
              font-weight: bold;
              letter-spacing: 2px;
              background-color: #4f46e5;
              color: white;
              display: inline-block;
              padding: 12px 24px;
              border-radius: 8px;
            ">
              ${code}
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6;">
            This code will expire on <strong style="color: #8B0000;">${(new Date(Date.now() + 60 * 60 * 1000)).toLocaleString()}</strong>.
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            If you did not request this, you can ignore this email.
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            Need help? Contact us at
            <a href="mailto:help@flatstudios.net" style="color: #283335; text-decoration: underline;">help@flatstudios.net</a>.
          </p>
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

    });

    return res.status(200).json({ message: 'Reset code sent to your email' });
  } catch (err) {
    console.error('Request reset error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
