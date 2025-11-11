import dbConnect from '@/utils/db';
import Newsletter from '@/models/News';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const items = await Newsletter.find().sort({ updatedAt: -1 }).lean();
    return res.status(200).json(items);
  }

  if (req.method === 'POST') {
    const { title, design, html } = req.body || {};
    const created = await Newsletter.create({ title: title || 'Untitled Newsletter', design, html });
    return res.status(200).json(created);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
