import dbConnect from '@/utils/db';
import Banner from '@/models/Banner';
import Disruption from '@/models/Disruption';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    // 🔎 1. Find active disruptions in the last 48 hours (or adjust if you archive them)
    const recentDisruptions = await Disruption.find()
      .sort({ incidentUpdated: -1 })
      .limit(5);

    if (recentDisruptions.length > 0) {
      // 🧩 Construct banner text dynamically
      let message;

      if (recentDisruptions.length === 1) {
        const d = recentDisruptions[0];
        message = `${d.incidentName} – affecting ${d.affectedRoutes?.length || 0} route${d.affectedRoutes?.length === 1 ? '' : 's'}`;
      } else {
        message = `${recentDisruptions.length} active service disruptions across Yapton routes`;
      }

      return res.status(200).json({
        active: true,
        message,
        linkText: 'View updates',
        linkUrl: '/ycc/travel',
        style: {
          bgColor: 'linear-gradient(90deg, #b5121b 0%, #c41e25 100%)', // Gatwick red
          textColor: '#ffffff',
        },
        source: 'disruptions',
      });
    }

    // 🪶 2. No disruptions — show your manual custom banner
    const banner = await Banner.findOne();
    return res.status(200).json(banner || null);
  }

  // 📝 Admin update
  if (req.method === 'PUT') {
    const { message, linkText, linkUrl, bgColor, textColor, active } = req.body;
    let banner = await Banner.findOne();
    if (!banner) banner = new Banner();
    banner.message = message;
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
