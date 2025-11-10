import dbConnect from '@/utils/db';
import BusStop from '@/models/BusStops';
import Route from '@/models/BusRoutes';
import Disruption from '@/models/Disruption';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;
  const { method } = req;

  try {
    // 🚌 GET stop info
    if (method === 'GET') {
      const stop = await BusStop.findById(id);
      if (!stop) return res.status(404).json({ error: 'Stop not found' });
      return res.status(200).json({ stop });
    }

    // ✏️ Update stop (handles closures too)
    if (method === 'PUT' || method === 'PATCH') {
      const updates = req.body;
      const stop = await BusStop.findByIdAndUpdate(id, updates, { new: true });
      if (!stop) return res.status(404).json({ error: 'Stop not found' });

      // 🧩 Find all routes that include this stop
      const affectedRoutes = await Route.find({ stops: stop.stopId });

      // 🚫 If stop is closed, create or update disruption + route diversions
      if (stop.closed) {
        const incidentId = `STOP-${stop.stopId}`;
        const incidentData = {
          incidentId,
          incidentName: `Stop Closed: ${stop.name}`,
          incidentDescription:
            stop.closureReason ||
            `The stop ${stop.name}${stop.town ? ', ' + stop.town : ''} is currently closed.`,
          affectedStops: [stop.stopId],
          affectedRoutes: affectedRoutes.map((r) => r.routeId),
          incidentType: 'Stop Closure',
          incidentUpdated: new Date(),
        };

        await Disruption.findOneAndUpdate(
          { incidentId },
          incidentData,
          { upsert: true, new: true }
        );

        // 🔁 Mark routes as diverted
        for (const route of affectedRoutes) {
          route.diversion = {
            active: true,
            reason: `Stop ${stop.name} closed`,
            stops: route.stops.filter((s) => s !== stop.stopId), // skip the closed stop
          };
          await route.save();
        }

        console.log(`🚨 Stop closure disruption created for ${stop.stopId}`);
      } else {
        // ✅ Stop reopened — remove disruption and clear route diversions if they only referenced this stop
        await Disruption.findOneAndDelete({ incidentId: `STOP-${stop.stopId}` });

        const affectedRoutes = await Route.find({ 'diversion.reason': { $regex: stop.name, $options: 'i' } });
        for (const route of affectedRoutes) {
          route.diversion = { active: false, reason: '', stops: [] };
          await route.save();
        }

        console.log(`✅ Stop reopened — disruptions cleared for ${stop.stopId}`);
      }

      return res.status(200).json({ stop });
    }

    // ❌ DELETE stop
    if (method === 'DELETE') {
      const stop = await BusStop.findByIdAndDelete(id);
      if (stop) {
        await Disruption.findOneAndDelete({ incidentId: `STOP-${stop.stopId}` });
      }
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Stops API error:', err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
