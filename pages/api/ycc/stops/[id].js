import dbConnect from '@/utils/db';
import BusStop from '@/models/BusStops';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;
  const { method } = req;

  try {
    if (method === 'GET') {
      const stop = await BusStop.findById(id);
      if (!stop) return res.status(404).json({ error: 'Stop not found' });
      return res.status(200).json({ stop });
    }

    if (method === 'PUT' || method === 'PATCH') {
      const stop = await BusStop.findByIdAndUpdate(id, req.body, { new: true });
      if (!stop) return res.status(404).json({ error: 'Stop not found' });
      return res.status(200).json({ stop });
    }

    if (method === 'DELETE') {
      await BusStop.findByIdAndDelete(id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Stops API error:', err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
