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

    // ✅ Serve directly from buffer if available (faster)
    if (report.buffer) {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      return res.send(report.buffer);
    }

    // ✅ Otherwise, fallback to GridFS
    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'weeklyReports',
    });

    const stream = bucket.openDownloadStream(report.fileId);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);

    stream.on('error', (err) => {
      console.error('GridFS stream error:', err);
      res.status(500).end('Error downloading file');
    });

    stream.pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: err.message });
  }
}
