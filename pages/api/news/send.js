import dbConnect from '@/utils/db';
import Newsletter from '@/models/News';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, to } = req.body || {};
  if (!id || !to) return res.status(400).json({ error: 'id and to are required' });

  const n = await Newsletter.findById(id).lean();
  if (!n) return res.status(404).json({ error: 'Newsletter not found' });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: n.title || 'Newsletter',
    html: n.html || '<p>(No content)</p>',
  });

  return res.status(200).json({ success: true, messageId: info.messageId });
}
