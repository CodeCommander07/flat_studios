// GET /api/appeals/:id
import dbConnect from '@/utils/db';
import Appeal from '@/models/Appeals';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  try {
    const appeal = await Appeal.findById(id);
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

    res.status(200).json(appeal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appeal' });
  }
}
