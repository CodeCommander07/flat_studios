import dbConnect from '@/utils/db';
import WeeklyReport from '@/models/WeeklyReport';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  try {
    const report = await WeeklyReport.findById(id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    // Sanitize the filename for both buffer & stream responses
    const safeFilename =
      report.filename?.replace(/[^a-zA-Z0-9._-]/g, '_') || 'report.xlsx';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(
        safeFilename
      )}`
    );

    // If report is stored directly as a buffer
    if (report.buffer) {
      return res.send(report.buffer);
    }

    // Otherwise stream it from GridFS
    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'weeklyReports',
    });

    const stream = bucket.openDownloadStream(report.fileId);
    stream.on('error', (err) => {
      console.error('GridFS stream error:', err);
      return res.status(500).json({ error: 'File streaming failed.' });
    });

    stream.pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: err.message });
  }
}
