import dbConnect from '@/utils/db';
import Content from '@/models/Content';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Optional: role/permission check here
      // if (!req.user || !['Admin','Editor'].includes(req.user.role)) return res.status(403).json({error:'Forbidden'});

      const exists = await Content.findOne({ slug: body.slug }).lean();
      if (exists) return res.status(409).json({ error: 'Slug already exists' });

      const doc = await Content.create({
        ...body,
        createdBy: req.user?._id,
        updatedBy: req.user?._id,
      });

      return res.status(201).json(doc);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to create content' });
    }
  }

  if (req.method === 'GET') {
    try {
      const {
        q, type, status, tag, category, visibility,
        page = 1, pageSize = 10, sort = '-createdAt'
      } = req.query;

      const filter = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (visibility) filter.visibility = visibility;
      if (tag) filter.tags = tag;
      if (category) filter.categories = category;
      if (q) filter.$text = { $search: q };

      const skip = (Number(page) - 1) * Number(pageSize);

      const [items, total] = await Promise.all([
        Content.find(filter).sort(sort).skip(skip).limit(Number(pageSize)).lean(),
        Content.countDocuments(filter)
      ]);

      return res.status(200).json({
        items,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        pages: Math.ceil(total / Number(pageSize)),
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to list content' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
