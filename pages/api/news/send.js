import dbConnect from '@/utils/db';
import Newsletter from '@/models/News';
import Subscriber from '@/models/Subscriber';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Newsletter ID is required' });

  // 📰 Load newsletter
  const n = await Newsletter.findById(id).lean();
  if (!n) return res.status(404).json({ error: 'Newsletter not found' });

  // 📬 Get only active, verified subscribers
  const subscribers = await Subscriber.find(
    { isActive: true, isVerified: true },
    'email -_id'
  ).lean();

  if (!subscribers.length)
    return res.status(404).json({ error: 'No active subscribers found' });

  // ✉️ Setup mail transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const results = [];
  for (const s of subscribers) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: s.email,
        subject: n.title || 'Newsletter',
        html: n.html || '<p>(No content)</p>',
      });

      results.push({ email: s.email, messageId: info.messageId });
      console.log(`✅ Sent newsletter to ${s.email}`);
    } catch (err) {
      console.error(`❌ Failed to send to ${s.email}:`, err.message);
      results.push({ email: s.email, error: err.message });
    }
  }

  return res.status(200).json({
    success: true,
    total: subscribers.length,
    sent: results.filter((r) => r.messageId).length,
    failed: results.filter((r) => r.error).length,
    results,
  });
}
