import dbConnect from '@/utils/db';
import Newsletter from '@/models/News';
import Subscriber from '@/models/Subscriber'; // ✅ make sure this model exists
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Newsletter ID is required' });

  // 📰 Fetch newsletter content
  const n = await Newsletter.findById(id).lean();
  if (!n) return res.status(404).json({ error: 'Newsletter not found' });

  // 📬 Fetch all subscriber emails
  const subscribers = await Subscriber.find({}, 'email -_id').lean();
  if (!subscribers.length)
    return res.status(404).json({ error: 'No subscribers found' });

  const emails = subscribers.map((s) => s.email);

  // ✉️ Setup SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // 🧩 Send in batches (optional to prevent rate limits)
  const BATCH_SIZE = 50;
  const results = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: batch.join(','), // send to multiple
        subject: n.title || 'Newsletter',
        html: n.html || '<p>(No content)</p>',
      });
      results.push({ batchStart: i, messageId: info.messageId });
      console.log(`✅ Sent batch ${i / BATCH_SIZE + 1}: ${batch.length} emails`);
    } catch (err) {
      console.error(`❌ Failed batch ${i / BATCH_SIZE + 1}`, err.message);
    }
  }

  return res.status(200).json({
    success: true,
    totalSubscribers: emails.length,
    batches: results.length,
    results,
  });
}
