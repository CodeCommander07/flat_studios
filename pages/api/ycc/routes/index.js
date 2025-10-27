import dbConnect from '@/utils/db';
import Route from '@/models/BusRoutes';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;

  try {
    if (method === 'GET') {
      const { q } = req.query;
      const find = q
        ? {
            $or: [
              { number: { $regex: q, $options: 'i' } },
              { operator: { $regex: q, $options: 'i' } },
              { origin: { $regex: q, $options: 'i' } },
              { destination: { $regex: q, $options: 'i' } },
              { description: { $regex: q, $options: 'i' } },
            ],
          }
        : {};
      const routes = await Route.find(find).sort({ operator: 1, number: 1 });
      return res.status(200).json({ routes });
    }

    if (method === 'POST') {
      const body = req.body;
      const created = await Route.create(body);
      return res.status(201).json({ route: created });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}