import dbConnect from "@/utils/db";
import BannerConfig from "@/models/Banner";
import Disruption from "@/models/Disruption";
import Route from "@/models/BusRoutes";

export default async function handler(req, res) {
  await dbConnect();

  // ---------- GET ----------
  if (req.method === "GET") {
    // First: disruption override (your existing logic)
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

    // If disruptions exist, override
    // if (enriched.length > 0) {
    //   let message;

    //   if (enriched.length === 1) {
    //     const d = enriched[0];
    //     const routeCount = d.inferredRoutes.length;
    //     message = `${d.incidentName} – affecting ${routeCount} route${
    //       routeCount === 1 ? "" : "s"
    //     }`;
    //   } else {
    //     const totalRoutes = new Set();
    //     enriched.forEach((d) =>
    //       d.inferredRoutes.forEach((r) => totalRoutes.add(r))
    //     );

    //     message = `${enriched.length} active disruptions affecting ${totalRoutes.size} route${
    //       totalRoutes.size === 1 ? "" : "s"
    //     }`;
    //   }

    //   return res.status(200).json({
    //     mode: "single-disruption",
    //     displayMode: "stack",
    //     banners: [
    //       {
    //         active: true,
    //         message,
    //         icon: "octagon-alert",
    //         linkText: "View updates",
    //         linkUrl: "/ycc/travel",
    //         bgColor: "linear-gradient(90deg, #b5121b 0%, #c41e25 100%)",
    //         textColor: "#ffffff",
    //       },
    //     ],
    //   });
    // }

    // No disruption → load stored configuration
    const config = await BannerConfig.findOne();
    if (!config) {
      return res.status(200).json({
        displayMode: "rotate",
        banners: [],
      });
    }

    return res.status(200).json(config.toObject());
  }

  // ---------- PUT ----------
  if (req.method === "PUT") {
    const { displayMode, banners } = req.body;

    const config = await BannerConfig.findOneAndUpdate(
      {},
      {
        displayMode: displayMode === "stack" ? "stack" : "rotate",
        banners: Array.isArray(banners) ? banners.slice(0, 3) : [],
      },
      { upsert: true, new: true }
    );

    return res.status(200).json(config.toObject());
  }

  return res.status(405).json({ error: "Method not allowed" });
}
