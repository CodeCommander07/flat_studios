import dbConnect from '@/utils/db';
import WeeklyReport from '@/models/WeeklyReport';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'DELETE')
    return res.status(405).json({ success: false, error: 'Method not allowed' });

  await dbConnect();
  const { id } = req.query;

  try {
    const report = await WeeklyReport.findById(id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    if (report.filename) {
      const filePath = path.join(process.cwd(), 'reports', report.filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await WeeklyReport.findByIdAndDelete(id);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
