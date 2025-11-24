import dbConnect from '@/utils/db';
import ContactRequest from '@/models/ContactRequest';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  await dbConnect();

  const { fromEmail, subject, message } = req.body;
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  if (!fromEmail || !subject || !message)
    return res.status(400).json({ message: 'Missing fields' });

  const newRequest = await ContactRequest.create({ fromEmail, subject, message });

    await transporter.sendMail({
    from: `"Yapton & District - Support" <help@flatstudios.net>`,
    to: fromEmail,
    subject,
    html: `
<div style="font-family: Arial, sans-serif; color: #000;">
  <div style="margin: 25px 0; text-align: center; color: #444;">
    <hr style="border:none;border-top:1px solid #ccc;margin:12px 0;">
    <p style="color:#888;font-size:13px;letter-spacing:0.5px;font-weight:600;font-family:'Segoe UI',sans-serif;">
      ——— <span style="color:#283335;">Please reply above this line</span> ———
    </p>
    <hr style="border:none;border-top:1px solid #ccc;margin:12px 0;">
  </div>
  <p>Dear ${fromEmail?.split('@')[0] ||
      'User'},</p>
  ${message}
  <p>Support ticket id: <strong>${newRequest._id}</strong></p>
  <table style="margin-top:1rem;">
    <tr>
      <td style="vertical-align:middle;padding-right:10px;">
        <img src="https://yapton.flatstudios.net/cdn/image/colour_logo.png" width="48" height="48" style="border-radius:10px;" />
      </td>
      <td style="vertical-align:middle;font-family:'Segoe UI',sans-serif;color:#222;">
        <p style="margin:0;font-size:15px;"><strong>SignalIQ</strong></p>
        <p style="margin:0;font-size:13px;color:#666;">System</p>
        <p style="margin:0;font-size:13px;color:#283335;"><strong>Flat Studios</strong></p>
      </td>
    </tr>
  </table>
</div>
`,
    headers: {},
  });
  res.status(201).json({ message: 'Request submitted', request: newRequest });
}
