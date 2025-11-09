import dbConnect from '@/utils/db';
import Route from '@/models/BusRoutes';
import Stops from '@/models/BusStops';
import Disruption from '@/models/Disruption';

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

      // 🆕 Reverse stops if requested
      if (updates.reverse === true) {
        const existing = await Route.findById(id);
        if (!existing) return res.status(404).json({ error: 'Not found' });

        // Reverse the stops array safely
        existing.stops = [...existing.stops].reverse();
        await existing.save();

        console.log(`🔁 Stops reversed for route ${existing.routeId}`);
        return res.status(200).json({ route: existing });
      }

      // Normal update
      const route = await Route.findByIdAndUpdate(id, updates, { new: true });
      if (!route) return res.status(404).json({ error: 'Not found' });

      // 🧩 Sync route to stops
      if (Array.isArray(route.stops) && route.stops.length > 0) {
        await Stops.updateMany(
          { routes: route.routeId },
          { $pull: { routes: route.routeId } }
        );

        await Stops.updateMany(
          { stopId: { $in: route.stops } },
          { $addToSet: { routes: route.routeId } }
        );
      }

      // 🚨 Handle Diversion / Disruption Save
      if (route.diversion && route.diversion.active) {
        const incidentId = `R-${route.routeId}`;
        const disruptionData = {
          incidentId,
          incidentName: `Diversion on Route ${route.number || route.routeId}`,
          incidentDescription:
            route.diversion.message ||
            `Route ${route.number || route.routeId} is currently on diversion.`,
          affectedStops: route.diversion.stops || [],
          affectedRoutes: [route.routeId],
          incidentType: 'Diversion',
          incidentUpdated: new Date(),
        };

        await Disruption.findOneAndUpdate(
          { incidentId },
          disruptionData,
          { upsert: true, new: true }
        );

        console.log(`✅ Disruption saved for route ${route.routeId}`);
      } else {
        await Disruption.findOneAndDelete({ incidentId: `R-${route.routeId}` });
        console.log(`🧹 Disruption cleared for route ${route.routeId}`);
      }

      return res.status(200).json({ route });
    }

    // ❌ Delete route
    if (method === 'DELETE') {
      const route = await Route.findByIdAndDelete(id);

      if (route) {
        await Stops.updateMany(
          { routes: route.routeId },
          { $pull: { routes: route.routeId } }
        );

        await Disruption.findOneAndDelete({ incidentId: `R-${route.routeId}` });
        console.log(`🗑️ Disruption deleted for removed route ${route.routeId}`);
      }

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Route update failed:', err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
