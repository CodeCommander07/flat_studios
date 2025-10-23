import dbConnect from '@/utils/db';
import Content from '@/models/Content';

export default async function handler(req, res) {
  await dbConnect();
  const { slug } = req.query;

  const doc = await Content.findOne({
    slug,
    $or: [
      { visibility: 'public' },
      { visibility: 'unlisted' } // let UI decide how it's surfaced
    ],
    status: 'published'
  }).lean();

  if (!doc) return res.status(404).json({ error: 'Not found' });
  return res.status(200).json(doc);
}
