import dbConnect from '@/utils/db';
import OperatorRequest from '@/models/OperatorRequest';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    // Total number of routes (all documents)
    const total = await OperatorRequest.countDocuments();

    // Group by selectedCompany and count
    const aggregation = await OperatorRequest.aggregate([
      {
        $group: {
          _id: '$selectedCompany',
          count: { $sum: 1 },
        },
      },
    ]);

    // Transform aggregation result to { companyName: count }
    const byCompany = {};
    aggregation.forEach(({ _id, count }) => {
      byCompany[_id || 'Unknown'] = count;
    });

    res.status(200).json({ total, byCompany });
  } catch (error) {
    console.error('Failed to fetch routes summary', error);
    res.status(500).json({ error: 'Server error' });
  }
}
