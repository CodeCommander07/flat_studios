import dbConnect from '@/utils/db';
import BusStop from '@/models/BusStops';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;

  try {
    if (method === 'GET') {
      const { q } = req.query;

      const filter = q
        ? {
            $or: [
              { name: new RegExp(q, 'i') },
              { town: new RegExp(q, 'i') },
              { stopId: new RegExp(q, 'i') },
            ],
          }
        : {};

      const stops = await BusStop.find(filter).sort({ name: 1 });

      return res.status(200).json({ stops });
    }

    if (method === 'POST') {
      const body = req.body || {};

      const stop = await BusStop.create(body);

      return res.status(201).json({ stop });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Stops API error:', err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
