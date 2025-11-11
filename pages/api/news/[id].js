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

    // 🧠 Build update object manually to avoid skipping falsy fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (design !== undefined) updateData.design = design;
    if (html !== undefined) updateData.html = html; // ✅ always save html
    if (status !== undefined) updateData.status = status;

    const updated = await Newsletter.findByIdAndUpdate(
      id,
      { $set: updateData },
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
