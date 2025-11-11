import dbConnect from '@/utils/db';
import Newsletter from '@/models/News';
import Subscriber from '@/models/Subscriber';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing newsletter ID' });

  await dbConnect();

  try {
    const newsletter = await Newsletter.findById(id);
    if (!newsletter)
      return res.status(404).json({ error: 'Newsletter not found' });

    console.log('Newsletter HTML length:', newsletter.html?.length || 0);

    const subscribers = await Subscriber.find({ isActive: true });
    if (!subscribers.length)
      return res.status(400).json({ error: 'No subscribers to send to!' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      secure: true,
    });

    const htmlContent =
      newsletter.html && newsletter.html.trim().length > 0
        ? newsletter.html
        : `<h2>${newsletter.title}</h2><p>[No HTML content found]</p>`;

    for (const sub of subscribers) {
      await transporter.sendMail({
        from: `"Yapton News" <${process.env.MAIL_USER}>`,
        to: sub.email,
        subject: newsletter.title || 'Latest Newsletter',
        html: htmlContent,
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
