import dbConnect from '@/utils/db';
import mongoose from 'mongoose';

const HandlerSchema = new mongoose.Schema({
  subject: { type: String, required: true, unique: true },
  handler: { type: String, default: null },
  updatedAt: { type: Date, default: Date.now },
});

const TicketHandler = mongoose.models.TicketHandler || mongoose.model('TicketHandler', HandlerSchema);

export default async function handler(req, res) {
  await dbConnect();

  try {
    if (req.method === 'POST') {
      const { subject, handler } = req.body;
      if (!subject || !handler)
        return res.status(400).json({ error: 'Missing subject or handler' });

      await TicketHandler.findOneAndUpdate(
        { subject },
        { handler, updatedAt: new Date() },
        { upsert: true, new: true }
      );

      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      const { subject } = req.query;
      if (!subject) return res.status(400).json({ error: 'Missing subject' });

      const record = await TicketHandler.findOne({ subject });
      return res.status(200).json(record || {});
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Handler API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
