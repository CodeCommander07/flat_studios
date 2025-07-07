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
    // Gmail SMTP transporter on port 465 with secure connection
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for port 465
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: '"Flat Studios" <noreply@flatstudios.net>',
      to,
      subject,
      html: message,
      headers: {},
    };

    // Add reply headers only if inReplyTo is provided
    if (inReplyTo) {
      mailOptions.headers['In-Reply-To'] = inReplyTo;
      mailOptions.headers['References'] = inReplyTo;
    }

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
