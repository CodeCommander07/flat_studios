import dbConnect from '@/utils/db';
import User from '@/models/User';
import InviteCode from '@/models/InviteCode';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, username, role, code, password,newsletter } = req.body;
  await dbConnect();

  const invite = await InviteCode.findOne({ code, email, used: false });
  if (!invite) return res.status(403).json({ message: 'Invalid or expired invite link' });

  if (invite.expiresAt && new Date() > invite.expiresAt) {
    return res.status(403).json({ message: 'Invite has expired' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);

  const id= new Date().getTime().toString(36) + Math.random().toString(36).substring(2, 15);

  const existingUsername = await User.findOne({ username:username });
  if (existingUsername) return res.status(409).json({ message: 'Username already taken' });

  await User.create({
    id,
    email,
    username,
    role:  role || 'User',
    password: hashed,
    newsletter,
    defaultAvatar: 'https://yapton.vercel.app/cdn/image/logo.png',
  });

  // invite.used = true;
  // invite.usedAt = new Date();
  // await invite.save();

  //  await InviteCode.findOneAndDelete({ code, email, used: true});

   const user = await User.findOne({id})
    const { password: _, ...safeUser } = user.toObject();


  res.status(200).json({ success: true, safeUser});
}
