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

  // Get newsletter
  const n = await Newsletter.findById(id).lean();
  if (!n) return res.status(404).json({ error: 'Newsletter not found' });

  // Get subscribers with username
  const subscribers = await Subscriber.find({}, 'email username').lean();
  if (!subscribers.length)
    return res.status(404).json({ error: 'No subscribers found' });

  // SMTP Transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Personalized emails (batch size 1)
  const results = [];

  for (let i = 0; i < subscribers.length; i++) {
    const sub = subscribers[i];

    // Personalised greeting
    const greeting = sub.username
      ? `Dear ${sub.username},`
      : `Dear user,`;

    const html = `
  <p style="margin-bottom: 16px; font-size: 16px;">${greeting}</p>
  ${n.html || '<p>(No content)</p>'}

  <hr style="margin: 24px 0; opacity: .3;" />

  <p style="font-size: 13px; opacity: .7;">
    <a href="https://yapton.vercel.app/me?newsletter=false&email=${sub.email}">
      Unsubscribe instantly
    </a>
  </p>
`;

    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.SMTP_FROM,    // still required
        bcc: sub.email,               // safe — does not expose emails
        subject: n.title || 'Newsletter',
        html,
      });

      results.push({
        email: sub.email,
        username: sub.username,
        messageId: info.messageId,
      });

      console.log(`✅ Sent to ${sub.email}`);
    } catch (err) {
      console.error(`❌ Failed for: ${sub.email}`, err.message);
    }
  }

  return res.status(200).json({
    success: true,
    sent: results.length,
    results,
  });
}
