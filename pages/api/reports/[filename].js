import path from 'path';
import fs from 'fs';
import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  const { filename } = req.query;
  const userId = req.headers['x-user-id'];

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  await dbConnect();
  const user = await User.findOne({ _id: userId });

  const allowedRoles = ['Community-Director', 'Human-Resources', 'Owner', 'Web-Developer'];
  if (!user || !allowedRoles.includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const filePath = path.resolve(`./storage/reports/${filename}`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  fs.createReadStream(filePath).pipe(res);
}
