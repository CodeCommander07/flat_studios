import dbConnect from '@/utils/db';
import InviteCode from '@/models/InviteCode';
import generateCode from '@/utils/generateCode';
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
  if (req.method !== 'POST') return res.status(405).end();

  const { email, role, username } = req.body;

  await dbConnect();

  try {
    let code = generateCode();
    // Ensure uniqueness
    while (await InviteCode.findOne({ code })) {
      code = generateCode();
    }
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await InviteCode.create({
      email,
      code,
      role: role || 'User',
      expiresAt,
    });

    const inviteUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/register?email=${encodeURIComponent(
      email
    )}&role=${encodeURIComponent(role)}&code=${code}`;

    let to = email
    await mailer.sendMail({
      from: 'Flat Studios <notifications@flatstudios.net>',
      to,
      subject: `Account Creation`,
      html: `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <tr>
        <td style="padding: 20px; background-color: #283335; color: #ffffff;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" style="vertical-align: middle; width: 50px;">
                <img src="https://flat-studios.vercel.app/cdn/image/logo.png" alt="Yapton & District Logo" style="max-width: 50px; height: auto; margin-right: 10px;">
              </td>
              <td align="center" style="vertical-align: middle;">
                <h1 style="font-size: 24px; margin: 0; color: #ffffff;">Account Creation</h1>
              </td>
              <td style="width: 50px;"></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <p style="font-size: 18px;">Hello <strong>${username || 'User'}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">We're excited to have you on board. Below are your details for the Yapton & District Staff Hub. To complete your account setup, please click the button below.</p>
          <p style="font-size: 16px; line-height: 1.6;">Account Details:<br />email: ${email}<br />username: ${username ||"User"}<br />role: ${role}</p>
          <p style="text-align: center; margin: 30px 0;">
  <a href="${inviteUrl}" 
     style="
       background-color: #4f46e5;
       color: white; 
       padding: 12px 24px; 
       text-decoration: none; 
       border-radius: 6px; 
       font-weight: bold;
       display: inline-block;
       margin-right: 10px;
     "
     target="_blank" rel="noopener noreferrer"
  >
    Activate Account
  </a>
</p>
<p style="font-size: 16px; line-height: 1.6;><a href="${inviteUrl}">${inviteUrl}</a></p>
<p style="font-size: 16px; line-height: 1.6; ">
            This link expires in <strong style="color:#8B0000">${expiresAt.toLocaleDateString()}</strong>
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            If you have any questions or require further details, please contact <a href="mailto:hello@flatstudios.net" style="color:#283335; text-decoration: underline;">hello@flatstudios.net</a>.
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
</html>
      `,
    });

    res.status(201).json({ success: true, code, inviteUrl });
  } catch (err) {
    console.error('Invite creation failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
