import dbConnect from '@/utils/db';
import WeeklyReport from '@/models/WeeklyReport';

export default async function handler(req, res) {
  await dbConnect();

  try {
    const reports = await WeeklyReport.find().sort({ createdAt: -1 }).select('filename createdAt');
    const data = reports.map((r) => ({
      id: r._id,
      filename: r.filename,
      date: r.createdAt,
      downloadUrl: `/api/reports/file/${r._id}`,
      viewUrl: `/api/reports/view/${r._id}`,
    }));

    res.status(200).json({ success: true, reports: data });
  } catch (err) {
    console.error('Error loading reports:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
