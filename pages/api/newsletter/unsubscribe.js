// pages/api/newsletter/unsubscribe.js
import dbConnect from '@/utils/db';
import Subscriber from '@/models/Subscriber';

export default async function handler(req, res) {
  await dbConnect();

  const { email } = req.method === 'GET' ? req.query : req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, message: 'Invalid email' });

  try {
    const subscriber = await Subscriber.findOne({ email });
    if (!subscriber)
      return res.status(404).json({ success: false, message: 'Subscriber not found' });

    subscriber.isActive = false;
    await subscriber.save();

    return res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
