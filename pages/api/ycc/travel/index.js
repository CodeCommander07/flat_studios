// /pages/api/ycc/travel.js
import dbConnect from '@/utils/db';
import Disruption from '@/models/Disruption';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;

  try {
    if (method === 'GET') {
      const disruptions = await Disruption.find().sort({ incidentUpdated: -1 });
      return res.status(200).json({ disruptions });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Failed to fetch disruptions:', err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
