import dbConnect from '@/utils/db';
import BusStop from '@/models/BusStops';
import Route from '@/models/BusRoutes';
import Disruption from '@/models/Disruption';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;
  const { method } = req;

  try {
    // GET: /api/ycc/stops/[id] => single stop
    if (method === 'GET') {
      const stop = await BusStop.findById(id);
      if (!stop) {
        return res.status(404).json({ error: 'Stop not found' });
      }
      return res.status(200).json({ stop });
    }

    // PUT/PATCH: update stop + closure / diversion logic
    if (method === 'PUT' || method === 'PATCH') {
      const updates = { ...(req.body || {}) };

      let stop = await BusStop.findById(id);
      if (!stop) {
        return res.status(404).json({ error: 'Stop not found' });
      }

      updates.updatedAt = new Date();

      // Save updated stop
      stop = await BusStop.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      );

      // Find routes that reference this stopId
      const affectedRoutes = await Route.find({
        $or: [
          { 'stops.forward': stop.stopId },
          { 'stops.backward': stop.stopId },
          { origin: stop.stopId },
          { destination: stop.stopId },
        ],
      });

      if (stop.closed) {
        // Create / update a disruption entry for this stop
        const incidentId = `STOP-${stop.stopId}`;

        const disruptionData = {
          incidentId,
          incidentName: `Stop Closed: ${stop.name}`,
          incidentDescription:
            stop.closureReason ||
            `The stop ${stop.name}${stop.town ? ', ' + stop.town : ''} is currently closed.`,
          affectedStops: [stop.stopId],
          affectedRoutes: affectedRoutes.map((r) => r.routeId),
          incidentType: 'Stop Closure',
          incidentUpdated: new Date(),
          tempStops: stop.tempStopId
            ? [{ closed: stop.stopId, temp: stop.tempStopId }]
            : [],
        };

        await Disruption.findOneAndUpdate(
          { incidentId },
          { $set: disruptionData },
          { upsert: true, new: true }
        );

        // Apply simple diversion: same route but without this stop
        for (const route of affectedRoutes) {
          const allStops = [
            ...(route.stops?.forward || []),
            ...(route.stops?.backward || []),
          ];

          route.diversion = {
            active: true,
            reason: `Stop ${stop.name} closed`,
            stops: allStops.filter((s) => s !== stop.stopId),
          };

          await route.save();
        }
      } else {
        // Stop reopened: clear single-stop disruption & related diversions
        await Disruption.findOneAndDelete({
          incidentId: `STOP-${stop.stopId}`,
        });

        const routesWithDiversion = await Route.find({
          'diversion.reason': { $regex: stop.name, $options: 'i' },
        });

        for (const route of routesWithDiversion) {
          route.diversion = { active: false, reason: '', stops: [] };
          await route.save();
        }
      }

      return res.status(200).json({ stop });
    }

    // DELETE: remove stop + its disruption + clear any diversions
    if (method === 'DELETE') {
      const stop = await BusStop.findByIdAndDelete(id);

      if (stop) {
        await Disruption.findOneAndDelete({
          incidentId: `STOP-${stop.stopId}`,
        });

        const routesWithDiversion = await Route.find({
          'diversion.stops': stop.stopId,
        });

        for (const route of routesWithDiversion) {
          route.diversion = { active: false, reason: '', stops: [] };
          await route.save();
        }
      }

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Stops API error:', err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
