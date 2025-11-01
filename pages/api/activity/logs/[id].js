import dbConnect from '@/utils/db';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import nodemailer from 'nodemailer';

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

  const { id } = req.query;
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Missing user ID' });

  const user = await User.findById(userId);
  if (!user || !user.email) return res.status(403).json({ error: 'User not found or missing email' });

  if (req.method === 'PUT') {
    const {
      date,
      timeJoined,
      timeLeft,
      duration,
      description,
      notable,
      host,
      participants,
    } = req.body;

    if (!date || !timeJoined || !timeLeft || duration == null || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const updated = await ActivityLog.findOneAndUpdate(
        { _id: id, userId },
        {
          date,
          timeJoined,
          timeLeft,
          duration,
          description,
          notable: notable || 'No',
          host: notable === 'Yes' ? host : '',
          participants: notable === 'Yes' ? participants : '',
        },
        { new: true }
      );

      if (!updated) return res.status(404).json({ error: 'Log not found' });

      await sendActivityEmail({
        user,
        activity: updated,
        subject: 'Activity Log Edited',
        type: 'edit',
      });

      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update log' });
    }

  } else if (req.method === 'DELETE') {
    try {
      const deleted = await ActivityLog.findOneAndDelete({ _id: id, userId });

      if (!deleted) return res.status(404).json({ error: 'Log not found' });

      await sendActivityEmail({
        user,
        activity: deleted,
        subject: 'Activity Log Deleted',
        type: 'delete',
      });

      res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete log' });
    }

  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function sendActivityEmail({ user, activity, subject, type }) {
  const actionText = type === 'edit' ? 'has been edited' : 'has been deleted';

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
                <h1 style="font-size: 24px; margin: 0; color: #ffffff;">Activity Log ${type === 'edit' ? 'Edited' : 'Deleted'}</h1>
              </td>
              <td style="width: 50px;"></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <p style="font-size: 18px;">Hi <strong>${user.username}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">
            An activity log ${actionText} with the following details:
          </p>
          <table cellpadding="6" cellspacing="0" width="100%" style="font-size: 16px; line-height: 1.6;">
            <tr><td><strong>Date</strong></td><td>${new Date(activity.date).toLocaleDateString('en-UK')}</td></tr>
            <tr><td><strong>Time Joined</strong></td><td>${activity.timeJoined}</td></tr>
            <tr><td><strong>Time Left</strong></td><td>${activity.timeLeft}</td></tr>
            <tr><td><strong>Duration</strong></td><td>${activity.duration}</td></tr>
            <tr><td><strong>Description</strong></td><td>${activity.description}</td></tr>
            <tr><td><strong>Notable</strong></td><td>${activity.notable === 'Yes' ? 'Yes' : 'No'}</td></tr>
            <tr><td><strong>Last Modified</strong></td><td>${new Date().toLocaleString()}</td></tr>
          </table>
          <p style="font-size: 16px; line-height: 1.6;">
            If you believe this was done in error, please contact <a href="mailto:admin@flatstudios.net" style="color:#283335; text-decoration: underline;">admin@flatstudios.net</a>.
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
</html>`;

  const mailOptions = {
    from: 'Flat Studios <notifications@flatstudios.net>',
    to: user.email,
    subject,
    html,
  };

  await mailHub.sendMail(mailOptions);
}
