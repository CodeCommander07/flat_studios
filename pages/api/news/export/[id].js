import dbConnect from '@/utils/db';
import Newsletter from '@/models/News';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;
  const n = await Newsletter.findById(id).lean();
  if (!n) return res.status(404).send('Not found');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${(n.title || 'newsletter').replace(/[^a-z0-9_-]/gi,'_')}.html"`);
  return res.status(200).send(n.html || '');
}
