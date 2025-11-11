import dbConnect from '@/utils/db';
import Newsletter from '@/models/Newsletter'; // assuming you have a Newsletter model
import Subscriber from '@/models/Subscriber'; // and a Subscriber list
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing newsletter ID' });

  await dbConnect();

  try {
    // 🔹 Load newsletter and subscribers
    const newsletter = await Newsletter.findById(id);
    if (!newsletter)
      return res.status(404).json({ error: 'Newsletter not found' });

    const subscribers = await Subscriber.find({ active: true });
    if (!subscribers.length)
      return res
        .status(400)
        .json({ error: 'No subscribers to send to!' });

    // 🔹 Email transport (configure to your system)
    const transporter = nodemailer.createTransport({
      host:"gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // 🔹 Send to all
    for (const sub of subscribers) {
      await transporter.sendMail({
        from: `"Yapton News" <${process.env.MAIL_USER}>`,
        to: sub.email,
        subject: newsletter.title || 'Latest Newsletter',
        html: newsletter.html || '<p>No content.</p>',
      });
    }

    res.json({
      success: true,
      message: `✅ Newsletter sent to ${subscribers.length} subscribers.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send newsletter.' });
  }
}
