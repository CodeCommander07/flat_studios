// GET /api/appeals/fetch
import dbConnect from '@/utils/db';
import Appeal from '@/models/Appeals';

export default async function handler(req, res) {
  await dbConnect();

  try {
    const appeals = await Appeal.find().sort({ banDate: -1 }); // includes notes automatically
    res.status(200).json(appeals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appeals' });
  }
}
