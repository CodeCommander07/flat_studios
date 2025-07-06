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
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; background: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
    <h2 style="color: #4f46e5; text-align: center;">You're Invited to Flat Studios!</h2>
    <p>Hi,</p>
    <p>You have been invited to join <strong>Flat Studios</strong>. Click the button below to register your account:</p>
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
      Expires At: ${expiresAt ? new Date(expiresAt) : 'Never'}
    </p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
    <p style="font-size: 14px; color: #666;">Best regards,<br/>The Flat Studios Team</p>
  </div>
  `
);

    res.status(201).json({ success: true, code, inviteUrl });
  } catch (err) {
    console.error('Invite creation failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
