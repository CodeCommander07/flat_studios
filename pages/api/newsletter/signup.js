import dbConnect from '@/utils/db'; // or your DB utility
import Newsletter from '@/models/Newsletter'; // Mongoose model

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email required' });
  }

  try {
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Already subscribed.' });
    }

    const entry = new Newsletter({ username, email });
    await entry.save();

    res.status(200).json({ message: 'Subscribed successfully!' });
  } catch (err) {
    console.error('Newsletter signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
