import dbConnect from '@/utils/db';
import InviteCode from '@/models/InviteCode';
import generateCode from '@/utils/generateCode';
import { sendMail } from '@/utils/mailHub';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, role, expiresAt, createdBy } = req.body;

  await dbConnect();

  try {
    let code = generateCode();
    // Ensure uniqueness
    while (await InviteCode.findOne({ code })) {
      code = generateCode();
    }

    await InviteCode.create({
      email,
      code,
      role: role || 'User',
      createdBy,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    const inviteUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/staff/register?email=${encodeURIComponent(
      email
    )}&role=${encodeURIComponent(role)}&code=${code}`;

   sendMail(
  email,
  'You have been invited to join Flat Studios',
  `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px;">
      <tr>
        <td style="padding: 20px; background-color: #283335; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" style="vertical-align: middle; width: 50px;">
                <img src="https://flat-studios.vercel.app/cdn/image/logo.png" alt="Yapton & District Logo" style="max-width: 50px; height: auto; margin-right: 10px;">
              </td>
              <td align="center" style="vertical-align: middle;">
                <h1 style="font-size: 24px; margin: 0; color: #ffffff;">You're Invited to Flat Studios!</h1>
              </td>
              <td style="width: 50px;"></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <p style="font-size: 18px;">Hi,</p>
          <p style="font-size: 16px; line-height: 1.6;">
            You have been invited to join <strong>Flat Studios</strong>. Click the button below to register your account:
          </p>
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
                ">
               Join Now
            </a>
          </p>
          <p style="text-align: center; font-size: 14px; color: #666;">
            Or use the invite code below:<br/>
            <strong style="font-size: 16px;">${code}</strong>
          </p>
          <p style="text-align: center; font-size: 14px; color: #999;">
            Expires At: ${expiresAt ? new Date(expiresAt).toLocaleString() : 'Never'}
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 20px; background-color: #f4f4f9; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
          <p style="font-size: 14px; color: #666;">Best regards,<br/>The Flat Studios Team</p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 10px; background-color: #f4f4f9; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
          <p style="font-size: 12px; color: #888;">This is an automated email. Yapton & District is a subsidiary of Flat Studios.</p>
        </td>
      </tr>
    </table>
  </body>
</html>

  `
);

    res.status(201).json({ success: true, code, inviteUrl });
  } catch (err) {
    console.error('Invite creation failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
