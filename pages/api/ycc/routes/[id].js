import dbConnect from '@/utils/db';
import Route from '@/models/BusRoutes';
import Stops from '@/models/BusStops';
import Disruption from '@/models/Disruption';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;
  const { id } = req.query;

  try {
    // 📍 GET single route
    if (method === 'GET') {
      const route = await Route.findById(id);
      if (!route) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ route });
    }

    // 🛠️ PUT/PATCH — Update route
    if (method === 'PUT' || method === 'PATCH') {
      const updates = req.body;

      // 🆕 Reverse stops if requested
      if (updates.reverse === true) {
        const existing = await Route.findById(id);
        if (!existing) return res.status(404).json({ error: 'Not found' });

        const forward = existing.stops?.forward || existing.stops || [];
        const backward = existing.stops?.backward || [];

        existing.stops = {
          forward: [...forward].reverse(),
          backward: [...backward].reverse(),
        };

        await existing.save();
        console.log(`🔁 Stops reversed for route ${existing.routeId}`);
        return res.status(200).json({ route: existing });
      }

      // ✅ Handle nested structures safely
      const flattened = { ...updates };

      // --- Normalize old schema before updating ---
      const existingRoute = await Route.findById(id);
      if (!existingRoute)
        return res.status(404).json({ error: 'Not found' });

      // If the old route had stops as an array, convert it
      if (Array.isArray(existingRoute.stops)) {
        existingRoute.stops = { forward: existingRoute.stops, backward: [] };
        await existingRoute.save();
        console.log(`🔄 Migrated stops to object for route ${existingRoute._id}`);
      }

      // --- Flatten updates for stops/diversion ---
      if (updates.stops && typeof updates.stops === 'object') {
        flattened['stops.forward'] = updates.stops.forward || [];
        flattened['stops.backward'] = updates.stops.backward || [];
        delete flattened.stops;
      }

      if (updates.diversion && typeof updates.diversion === 'object') {
        flattened['diversion.active'] = updates.diversion.active || false;
        flattened['diversion.reason'] = updates.diversion.reason || '';
        flattened['diversion.stops'] = updates.diversion.stops || [];
        delete flattened.diversion;
      }

      // 🧩 Update safely
      const route = await Route.findByIdAndUpdate(
        id,
        { $set: flattened },
        { new: true, runValidators: true }
      );

      if (!route) return res.status(404).json({ error: 'Not found' });

      // 🧭 Sync stops (forward + backward)
      const allStops = [
        ...(route.stops?.forward || []),
        ...(route.stops?.backward || []),
      ];

      if (allStops.length > 0) {
        await Stops.updateMany(
          { routes: route.routeId },
          { $pull: { routes: route.routeId } }
        );

        await Stops.updateMany(
          { stopId: { $in: allStops } },
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
            route.diversion.reason ||
            `Route ${route.number || route.routeId} is currently on diversion.`,
          affectedStops: route.diversion.stops || [],
          affectedRoutes: [route.routeId],
          incidentType: 'Diversion',
          incidentUpdated: new Date(),
        };

        await Disruption.findOneAndUpdate({ incidentId }, disruptionData, {
          upsert: true,
          new: true,
        });

        console.log(`✅ Disruption saved for route ${route.routeId}`);
      } else {
        await Disruption.findOneAndDelete({ incidentId: `R-${route.routeId}` });
        console.log(`🧹 Disruption cleared for route ${route.routeId}`);
      }

      return res.status(200).json({ route });
    }

    // ❌ DELETE route
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
