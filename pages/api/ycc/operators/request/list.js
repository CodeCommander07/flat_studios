// pages/api/ycc/admin/operator-requests/index.js
import dbConnect from '@/utils/db';
import OperatorApplication from '@/models/OperatorSubmission';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const requests = await OperatorApplication.find({})
        .sort({ createdAt: -1 })
        .select('_id email discordUsername operatorName status createdAt updatedAt')
        .lean();

      const enriched = requests.map((r) => ({
        _id: r._id,
        status: r.status || 'Pending',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        meta: {
          operatorName: r.operatorName || 'Unknown Operator',
          submitter: r.discordUsername || r.email || 'Unknown User',
          email: r.email || 'unknown@flatstudios.net',
        },
      }));

      res.status(200).json({ success: true, requests: enriched });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
}
