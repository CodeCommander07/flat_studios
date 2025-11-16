// /api/user/delete.js
import dbConnect from '@/utils/db';
import User from '@/models/User';
import nodemailer from 'nodemailer';

const mailHub = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  secure: true,
})

export default async function handler(req, res) {
  if (req.method !== 'DELETE')
    return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();
  const { id } = req.query;

  try {
    const u = await User.findById(id)
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
                <img src="https://yapton.vercel.app/cdn/image/logo.png" alt="Yapton & District Logo" style="max-width: 50px; height: auto; margin-right: 10px;">
              </td>
              <td align="center" style="vertical-align: middle;">
                <h1 style="font-size: 24px; margin: 0; color: #ffffff;">Account Deletion</h1>
              </td>
              <td style="width: 50px;"></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <p style="font-size: 18px;">Hi <strong>${u.username}</strong>,</p>
          <table cellpadding="6" cellspacing="0" width="100%" style="font-size: 16px; line-height: 1.6;">
          <tr><td><strong>Email</strong></td><td>${u.email}</td></tr>
          <tr><td><strong>Role:</strong></td><td>${u.role}</td></tr>
          <tr><td><strong>Account Created</strong></td><td>${new Date(u.createdAt).toLocaleDateString('en-UK')}</td></tr>
          <tr><td><strong>Date</strong></td><td>${new Date().toLocaleDateString('en-UK')}</td></tr>
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

  const mailOptions = {
    from: '"Flat Studios" <notification@flatstudios.net>',
    to: u.email,
    subject: "Account Deletion",
    html,
  };
  await mailHub.sendMail(mailOptions);
    await User.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
