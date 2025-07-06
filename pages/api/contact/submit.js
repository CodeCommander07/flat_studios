import dbConnect from '@/utils/db';
import ContactRequest from '@/models/ContactRequest';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  await dbConnect();

  const { fromEmail, subject, message } = req.body;
  

  if (!fromEmail || !subject || !message)
    return res.status(400).json({ message: 'Missing fields' });

  const newRequest = await ContactRequest.create({ fromEmail, subject, message });

  res.status(201).json({ message: 'Request submitted', request: newRequest });
}
