import dbConnect from '@/utils/db';
import Route from '@/models/BusRoutes';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;
  const { id } = req.query;

  try {
    if (method === 'GET') {
      const route = await Route.findById(id);
      if (!route) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ route });
    }

    if (method === 'PUT' || method === 'PATCH') {
      const updates = req.body;
      const route = await Route.findByIdAndUpdate(id, updates, { new: true });
      if (!route) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ route });
    }

    if (method === 'DELETE') {
      await Route.findByIdAndDelete(id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}