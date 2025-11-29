import dbConnect from '@/utils/db';
import Disciplinary from '@/models/Disciplinary';
import User from '@/models/User';
import nodemailer from 'nodemailer';

const SITE = process.env.LIVE_URL || 'https://yapton.flatstudios.net';
const FROM = process.env.MAIL_FROM || process.env.MAIL_USER;

// ✅ Setup nodemailer transporter
const mailer =
  process.env.MAIL_USER && process.env.MAIL_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        secure: true,
      })
    : null;

// ✉️ Branded HTML template for all notifications
function disciplinaryEmailTemplate({ title, subtitle, reason, severity, notes, status, issuedBy, staffName }) {
  const color =
    severity === 'Verbal Warning'
      ? '#3b82f6'
      : severity === 'Warning'
      ? '#facc15'
      : severity === 'Suspension'
      ? '#fb923c'
      : '#dc2626';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f4f4f9;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <tr>
      <td align="center" style="background-color:#283335; padding:20px;">
        <img src="https://yapton.flatstudios.net/logo.png" width="80" alt="FlatStudios" style="display:block; margin-bottom:10px;" />
        <h1 style="color:#ffffff; font-size:20px; margin:0;">${title}</h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:24px 20px; color:#333333;">
        <p style="font-size:16px; margin-top:0;">Hello ${staffName || 'Staff Member'},</p>
        <p style="font-size:16px; line-height:1.6;">${subtitle}</p>

        <p style="font-size:15px; line-height:1.6; background:#f8f9fa; border-left:4px solid ${color}; padding:10px 15px; border-radius:4px; margin:20px 0;">
          <strong>Reason:</strong> ${reason || 'No reason provided'}<br>
          <strong>Severity:</strong> ${severity || 'N/A'}<br>
          ${notes ? `<strong>Notes:</strong> ${notes}<br>` : ''}
          <strong>Status:</strong> ${status || 'Active'}<br>
          <strong>Issued By:</strong> ${issuedBy || 'Unknown'}
        </p>

        <p style="font-size:15px; margin-top:25px; color:#555;">
          Regards,<br><strong>FlatStudios HR</strong>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="background-color:#f4f4f9; padding:12px; font-size:12px; color:#999;">
        © ${new Date().getFullYear()} FlatStudios. All rights reserved.<br>
        <a href="${SITE}" style="color:#007bff; text-decoration:none;">Visit Website</a>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ✅ Safe sendMail wrapper
async function sendMail(to, subject, html) {
  if (!mailer || !to) return;
  try {
    await mailer.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('❌ Email send error:', err.message);
  }
}

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  // 🟦 GET record
  if (req.method === 'GET') {
    try {
      const record = await Disciplinary.findById(id)
        .populate('staffId', 'username email')
        .populate('issuedById', 'username email')
        .lean();

      if (!record) return res.status(404).json({ message: 'Not found' });
      return res.status(200).json({ record });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  // 🟧 PUT (update or status change)
  if (req.method === 'PUT') {
    try {
      const before = await Disciplinary.findById(id).lean();
      if (!before) return res.status(404).json({ message: 'Not found' });

      const updated = await Disciplinary.findByIdAndUpdate(id, req.body, { new: true })
        .populate('staffId', 'username email')
        .populate('issuedById', 'username email')
        .lean();

       
        
      // Send notification email
      if (updated?.staffId?.email) {
        const html = disciplinaryEmailTemplate({
          title: 'Disciplinary Record Updated',
          subtitle:
            before.status !== updated.status
              ? `The status of your disciplinary record has changed from <strong>${before.status}</strong> to <strong>${updated.status}</strong>.`
              : 'Your disciplinary record details have been updated.',
          reason: updated.reason,
          severity: updated.severity,
          notes: updated.notes,
          status: updated.status,
          issuedBy: updated.issuedById?.username,
          staffName: updated.staffId?.username,
        });

        await sendMail(
          updated.staffId.email,
          `Disciplinary Record Updated – ${updated.severity}`,
          html
        );
      }

      return res.status(200).json({ record: updated });
    } catch (err) {
      console.error('❌ Update error:', err);
      return res.status(500).json({ message: err.message });
    }
  }

  // 🟥 DELETE record
  if (req.method === 'DELETE') {
    try {
      const record = await Disciplinary.findByIdAndDelete(id)
        .populate('staffId', 'username email')
        .populate('issuedById', 'username email')
        .lean();

      if (!record) return res.status(404).json({ message: 'Not found' });

      // Send deletion notice
      if (record?.staffId?.email) {
        const html = disciplinaryEmailTemplate({
          title: 'Disciplinary Record Deleted',
          subtitle: `Your disciplinary record has been permanently removed by ${record.issuedById?.username || 'HR'}.`,
          reason: record.reason,
          severity: record.severity,
          notes: record.notes,
          status: 'Deleted',
          issuedBy: record.issuedById?.username,
          staffName: record.staffId?.username,
        });

        await sendMail(record.staffId.email, 'Disciplinary Record Deleted', html);
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('❌ Delete error:', err);
      return res.status(500).json({ message: err.message });
    }
  }

  // 🚫 Method not allowed
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).json({ message: 'Method Not Allowed' });
}
