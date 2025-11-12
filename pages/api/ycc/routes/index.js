import dbConnect from '@/utils/db';
import Route from '@/models/BusRoutes';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;

  try {
    // 🟢 GET all routes (with optional search query)
    if (method === 'GET') {
      const { q } = req.query;

      const find = q
        ? {
            $or: [
              { number: { $regex: q, $options: 'i' } },
              { operator: { $regex: q, $options: 'i' } },
              { origin: { $regex: q, $options: 'i' } },
              { destination: { $regex: q, $options: 'i' } },
              { description: { $regex: q, $options: 'i' } },
            ],
          }
        : {};

      const routes = await Route.find(find).sort({ operator: 1, number: 1 });
      return res.status(200).json({ routes });
    }

    // 🟡 POST — Create new route
    if (method === 'POST') {
      const body = req.body;

      // ✅ Ensure proper nested stops structure
      const stops = {
        forward: body.stops?.forward || [],
        backward: body.stops?.backward || [],
      };

      // ✅ Ensure diversion structure too
      const diversion = {
        active: body.diversion?.active || false,
        reason: body.diversion?.reason || '',
        stops: body.diversion?.stops || [],
      };
        function generateRouteId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

      const created = await Route.create({
        routeId: generateRouteId(),
        number: body.number?.trim(),
        operator: Array.isArray(body.operator)
  ? body.operator
  : body.operator
  ? [body.operator.trim()]
  : [],
        origin: body.origin || '',
        destination: body.destination || '',
        description: body.description || '',
        stops,
        diversion,
      });

      return res.status(201).json({ route: created });
    }

    // 🚫 Invalid method
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Route creation failed:', err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
