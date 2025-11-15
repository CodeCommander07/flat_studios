import User from '@/models/User';
import dbConnect from '@/utils/db';
import nodemailer from 'nodemailer';

const mailHub = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  secure: true,
});

export async function notifyUser(user, notification, link = null) {
  await dbConnect();
  const u = await User.findOne({ _id: user._id });
  if (!u) return;

  u.notifications.push({ notification, link });
  await u.save();

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
                <Image src="https://yapton.vercel.app/cdn/image/logo.png" alt="Yapton & District Logo" style="max-width: 50px; height: auto; margin-right: 10px;">
              </td>
              <td align="center" style="vertical-align: middle;">
                <h1 style="font-size: 24px; margin: 0; color: #ffffff;">Notification</h1>
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
          <tr><td><strong>Notification</strong></td><td>${notification}</td></tr>
          <tr><td><strong>Link</strong></td><td><a href="https://yapton.vercel.app/${link}">https://yapton.vercel.app/${link}</a></td></tr>
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
    subject: "New Notification",
    html,
  };
  await mailHub.sendMail(mailOptions);
  console.log('Email sent successfully');

  return true;
}
