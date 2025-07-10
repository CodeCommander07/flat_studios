import fs from 'fs';
import path from 'path';
import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  const userId = req.headers['x-user-id'];

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  await dbConnect();
  const user = await User.findOne({ _id: userId });

  const allowedRoles = ['Community-Director', 'Human-Resources', 'Owner', 'Web-Developer'];
  if (!user || !allowedRoles.includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const reportsDir = path.resolve('./storage/reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const files = fs.readdirSync(reportsDir).filter(name => name.endsWith('.xlsx'));
  files.sort((a, b) => b.localeCompare(a)); // newest first

  res.status(200).json(files);
}
