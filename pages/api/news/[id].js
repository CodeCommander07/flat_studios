import dbConnect from '@/utils/db';
import Newsletter from '@/models/News';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'GET') {
    const item = await Newsletter.findById(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(item);
  }

  if (req.method === 'PUT') {
    const { title, design, html, status } = req.body || {};
    const updated = await Newsletter.findByIdAndUpdate(
      id,
      { $set: { ...(title && { title }), ...(design && { design }), ...(html && { html }), ...(status && { status }) } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    await Newsletter.findByIdAndDelete(id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
