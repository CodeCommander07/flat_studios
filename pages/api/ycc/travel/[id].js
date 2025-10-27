import dbConnect from '@/utils/db';
import Disruption from '@/models/Disruption';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;
  const { method } = req;

  try {
    if (method === 'GET') {
      const disruption = await Disruption.findById(id);
      if (!disruption)
        return res.status(404).json({ error: 'Disruption not found' });

      return res.status(200).json({ disruption });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Failed to fetch disruption:', err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
