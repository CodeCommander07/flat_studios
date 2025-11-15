import dbConnect from '@/utils/db';
import LeaveRequest from '@/models/LeaveRequest';
import nodemailer from 'nodemailer';
import { notifyUser } from '@/utils/notifyUser';

const mailHub = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    secure: true,
});

export default async function handler(req, res) {
    await dbConnect();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id, status, adminId } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    if (!adminId) {
        return res.status(400).json({ error: 'Missing adminId for audit log' });
    }

    try {
        const leave = await LeaveRequest.findById(id).populate('userId', 'email username');

        if (!leave) {
            return res.status(404).json({ error: 'Leave request not found' });
        }

        leave.status = status;
        leave.approvedBy = adminId;
        leave.decisionDate = new Date();

        await leave.save();

        // Send email notification
        const to = leave.userId.email;
        const userName = leave.userId.username;
        const subject = `Your leave request has been ${status.toLowerCase()}`;
        const html = `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <tr>
        <td style="padding: 20px; background-color: #283335; color: #ffffff;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" style="vertical-align: middle; width: 50px;">
                <Image src="https://yapton.vercel.app/cdn/image/logo.png" alt="Yapton & District Logo" style="max-width: 50px; height: auto; margin-right: 10px;">
              </td>
              <td align="center" style="vertical-align: middle;">
                <h1 style="font-size: 24px; margin: 0; color: #ffffff;">Authorsied Leave Update</h1>
              </td>
              <td style="width: 50px;"></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <p style="font-size: 18px;">Hi <strong>${userName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">
            Your leave request has been 
            <strong style="color: ${status === 'Approved' ? '#1e7e34' : '#a71d2a'};">${status.toLowerCase()}</strong>.
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            <strong>Leave period:</strong> ${new Date(leave.startDate).toLocaleDateString('en-UK')} to ${new Date(leave.endDate).toLocaleDateString('en-UK')}<br>
            <strong>Reason:</strong> ${leave.reason}
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            If you have any questions, feel free to reach out to <a style="text: underline; color:#283335" href="mailto:authorisedleave@flatstudios.net">authorisedleave@flatstudios.net</a> or <strong style="text:underline">Cypher</strong> directly.
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 20px; background-color: #f4f4f9;">
          <p style="font-size: 14px;">Regards,<br><strong>Yapton & District Admin Team</strong></p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 10px; background-color: #f4f4f9;">
          <p style="font-size: 12px; color: #888;">This is an automated email. Yapton & District is a subsidiary of Flat Studios.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

        const mailOptions = {
            from: "Flat Studios <notifications@flatstudios.net>",
            replyTo: "Authorised Leave Support <authorisedleave@flatstudios.net>",
            bcc: "admin@flatstudios.net",
            to,
            subject,
            html,
        };

        await mailHub.sendMail(mailOptions);
        const notMessage = `Your leave request from ${new Date(leave.startDate).toLocaleDateString('en-UK')} to ${new Date(leave.endDate).toLocaleDateString('en-UK')} has been ${status}`
        await notifyUser(leave.userId, notMessage, '/me/leave');

        return res.status(200).json(leave);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update status' });
    }
}
