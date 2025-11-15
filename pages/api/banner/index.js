import dbConnect from '@/utils/db';
import Banner from '@/models/Banner';
import Disruption from '@/models/Disruption';
import Route from '@/models/BusRoutes';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const [recentDisruptions, routes] = await Promise.all([
      Disruption.find().sort({ incidentUpdated: -1 }).limit(5).lean(),
      Route.find().lean(),
    ]);

    const stopToRoutesMap = {};
    routes.forEach((r) => {
      const allStops = [
        ...(r.stops?.forward || []),
        ...(r.stops?.backward || []),
        r.origin,
        r.destination,
      ].filter(Boolean);

      allStops.forEach((sid) => {
        if (!stopToRoutesMap[sid]) stopToRoutesMap[sid] = new Set();
        stopToRoutesMap[sid].add(r._id.toString());
      });
    });

    const enriched = recentDisruptions.map((d) => {
      const affected = new Set((d.affectedRoutes || []).map(String));

      (d.affectedStops || []).forEach((sid) => {
        const via = stopToRoutesMap[sid];
        if (via) via.forEach((rid) => affected.add(rid));
      });

      return {
        ...d,
        inferredRoutes: Array.from(affected),
      };
    });

    if (enriched.length > 0) {
      let message;

      if (enriched.length === 1) {
        const d = enriched[0];
        const routeCount = d.inferredRoutes.length;

        message = `${d.incidentName} – affecting ${routeCount} route${routeCount === 1 ? '' : 's'}`;
      } else {
        const totalRoutes = new Set();
        enriched.forEach((d) => d.inferredRoutes.forEach((r) => totalRoutes.add(r)));

        message = `${enriched.length} active disruptions affecting ${totalRoutes.size} route${totalRoutes.size === 1 ? '' : 's'}`;
      }

      return res.status(200).json({
        active: true,
        message,
        icon: "OctagonAlert",
        linkText: 'View updates',
        linkUrl: '/ycc/travel',
        bgColor: 'linear-gradient(90deg, #b5121b 0%, #c41e25 100%)',
        textColor: '#ffffff',
        source: 'disruptions',
      });
    }

    const banner = await Banner.findOne();
    return res.status(200).json(banner || null);
  }

  if (req.method === 'PUT') {
    const { message, icon, linkText, linkUrl, bgColor, textColor, active } = req.body;
    let banner = await Banner.findOne();
    if (!banner) banner = new Banner();

    banner.message = message;
    banner.icon = icon;
    banner.linkText = linkText;
    banner.linkUrl = linkUrl;
    banner.bgColor = bgColor;
    banner.textColor = textColor;
    banner.active = active;

    await banner.save();
    return res.status(200).json(banner);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
