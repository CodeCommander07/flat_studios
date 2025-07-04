import dbConnect from '@/utils/db';
import InviteCode from '@/models/InviteCode';
import generateCode from '@/utils/generateCode';

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

    const inviteUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/register?email=${encodeURIComponent(
      email
    )}&role=${encodeURIComponent(role)}&code=${code}`;

    res.status(201).json({ success: true, code, inviteUrl });
  } catch (err) {
    console.error('Invite creation failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
