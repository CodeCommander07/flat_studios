import { sendMail } from '@/utils/mailHub';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  let html

  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    
    html = `<p>${message}</p>`;
    sendMail(
      to,
      subject,
      html,
    );

    res.status(200).json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error('SendMail error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
}
