import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  const { to, subject, message, inReplyTo, staff } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing to, subject, or message fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Yapton & District - ${staff || 'Support'}" <help@flatstudios.net>`,
      to,
      subject,
      html: message,
      headers: {},
    };

    if (inReplyTo) {
      mailOptions.inReplyTo = inReplyTo;
      mailOptions.references = inReplyTo;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`📩 Sent threaded reply to ${to}`);

    return res.status(200).json({
      message: 'Reply sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
