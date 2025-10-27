// pages/api/newsletter/manage.js
import dbConnect from '@/utils/db';
import Subscriber from '@/models/Subscriber';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const { email } = req.query;
    const subscriber = await Subscriber.findOne({ email });
    return res.status(200).json({
      subscribed: !!(subscriber && subscriber.isActive),
      email,
    });
  }

  if (req.method === 'POST') {
    const { email, subscribed } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const subscriber = await Subscriber.findOne({ email });
    if (!subscriber)
      return res.status(404).json({ success: false, message: 'Subscriber not found' });

    subscriber.isActive = Boolean(subscribed);
    await subscriber.save();

    return res.status(200).json({ success: true, message: 'Preferences updated' });
  }

  res.status(405).json({ success: false, message: 'Method not allowed' });
}
