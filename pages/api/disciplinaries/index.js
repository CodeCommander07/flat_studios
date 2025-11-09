import dbConnect from '@/utils/db';
import Disciplinary from '@/models/Disciplinary';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const { staffId, issuedById, reason, severity, notes } = req.body;

      if (!staffId || !issuedById || !reason || !severity) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
      }

      // Create the record
      const record = await Disciplinary.create({
        staffId,
        issuedById,
        reason,
        severity,
        notes,
      });

      // Fetch full user details for email
      const staffUser = await User.findById(staffId).select('username email');
      const issuer = await User.findById(issuedById).select('username email');

      if (staffUser?.email) {
        // 💌 Send email notification
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });

        const html = `
          <!DOCTYPE html>
          <html>
          <body style="font-family:Arial, sans-serif; background-color:#f4f4f9; margin:0; padding:0;">
            <table align="center" cellpadding="0" cellspacing="0" width="600"
              style="margin:20px auto;background-color:#ffffff;border-radius:6px;
              box-shadow:0 2px 4px rgba(0,0,0,0.1);overflow:hidden;">
              <tr>
                <td style="background-color:#283335;color:#fff;padding:20px;">
                  <h1 style="margin:0;font-size:20px;text-align:center;">
                    Disciplinary Action: 
                    <strong style="color:${
                      severity === 'Verbal Warning'
                        ? '#3b82f6'
                        : severity === 'Warning'
                        ? '#facc15'
                        : severity === 'Suspension'
                        ? '#fb923c'
                        : '#dc2626'
                    };">${severity}</strong>
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  <p style="font-size:16px;">Hello ${staffUser.name},</p>
                  <p style="font-size:16px;">You have received a <strong>${severity}</strong>.</p>
                  <p style="font-size:15px;line-height:1.5;">
                    <strong>Reason:</strong> ${reason}<br/>
                    ${notes ? `<strong>Notes:</strong> ${notes}` : ''}
                  </p>
                  <p style="font-size:14px;margin-top:20px;">Issued by: ${issuer?.name || 'System'}</p>
                  <p style="margin-top:25px;font-size:14px;">Regards,<br/>FlatStudios HR</p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: process.env.MAIL_FROM || process.env.MAIL_USER,
          to: staffUser.email,
          subject: `Disciplinary Notice - ${severity}`,
          html,
        });
      }

      return res.status(201).json({ success: true, record });
    } catch (err) {
      console.error('❌ Disciplinary creation error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const records = await Disciplinary.find()
        .populate('staffId', 'username email')
        .populate('issuedById', 'username email')
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, records });
    } catch (err) {
      console.error('❌ Fetch error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
