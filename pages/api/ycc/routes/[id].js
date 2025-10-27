import dbConnect from '@/utils/db';
import Route from '@/models/BusRoutes';
import Stops from '@/models/BusStops';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;
  const { id } = req.query;

  try {
    // 📍 Get route
    if (method === 'GET') {
      const route = await Route.findById(id);
      if (!route) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ route });
    }

    // 🛠️ Update or Patch route
    if (method === 'PUT' || method === 'PATCH') {
      const updates = req.body;
      const route = await Route.findByIdAndUpdate(id, updates, { new: true });
      if (!route) return res.status(404).json({ error: 'Not found' });

      // 🧩 Sync route to stops
      if (Array.isArray(route.stops) && route.stops.length > 0) {
        // Remove this route ID from all stops first
        await Stops.updateMany(
          { routes: route.routeId }, // routeId is your custom field (not _id)
          { $pull: { routes: route.routeId } }
        );

        // Then add it back to only the relevant stops
        await Stops.updateMany(
          { stopId: { $in: route.stops } },
          { $addToSet: { routes: route.routeId } }
        );
      }

      return res.status(200).json({ route });
    }

    // ❌ Delete route
    if (method === 'DELETE') {
      const route = await Route.findByIdAndDelete(id);

      if (route) {
        // Remove route from any stops it was linked to
        await Stops.updateMany(
          { routes: route.routeId },
          { $pull: { routes: route.routeId } }
        );
      }

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Route update failed:', err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
