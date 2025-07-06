import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  const { to, subject, message, inReplyTo } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing to, subject or message fields' });
  }

  try {
        // Create transporter for Gmail SMTP — make sure MAIL_USER and MAIL_PASS are set in env
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      secure: true,
    });

    const mailOptions = {
      from: "<Flat Studios> <noreply@flatstudios.net>",
      to,
      subject,
      html: message,
      headers: {},
    };

    // Add In-Reply-To and References headers if message ID provided
    if (inReplyTo) {
      mailOptions.headers['In-Reply-To'] = inReplyTo;
      mailOptions.headers['References'] = inReplyTo;
    }

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
}
