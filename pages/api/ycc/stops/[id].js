import dbConnect from '@/utils/db';
import BusStops from '@/models/BusStops';
import BusRoutes from '@/models/BusRoutes';

export default async function handler(req, res) {
  const { id } = req.query; // stopId (not _id)
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Find stop by stopId
    const stop = await BusStops.findOne({ stopId: id }).lean();
    if (!stop) return res.status(404).json({ error: 'Stop not found' });

    // Optionally, ensure routeId references are valid
    const allRoutes = await BusRoutes.find(
      { routeId: { $in: stop.routes || [] } },
      { routeId: 1, number: 1 }
    ).lean();

    // Replace invalid route IDs with filtered list
    const validRouteIds = allRoutes.map(r => r.routeId);
    if (JSON.stringify(validRouteIds) !== JSON.stringify(stop.routes)) {
      stop.routes = validRouteIds;
    }

    return res.status(200).json({ stop });
  } catch (err) {
    console.error('Error fetching stop:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
