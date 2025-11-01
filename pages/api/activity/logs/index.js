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

  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Missing user ID' });

  if (req.method === 'GET') {
    try {
      const logs = await ActivityLog.find({ userId }).sort({ createdAt: -1 });
      return res.status(200).json(logs);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        userId: bodyUserId,
        date,
        timeJoined,
        timeLeft,
        duration,
        description,
        notable,
        host,
        participants,
      } = req.body;

      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }

      const newLog = await ActivityLog.create({
        userId: bodyUserId,
        date,
        timeJoined,
        timeLeft,
        duration,
        description,
        notable,
        host,
        participants,
      });

      // Use .findById if userId is MongoDB _id, or update if using custom userId field
      const user = await User.findById(bodyUserId);

      if (!user || !user.email) {
        console.warn('User or email not found. Skipping email.');
        return res.status(201).json(newLog);
      }

// --- 💬 DISCORD WEBHOOK EMBED ---
try {
  const webhookUrl ="https://discordapp.com/api/webhooks/1158481712586686516/bwICusjZu3N5t-T4jkwPnRxuK0d8bQ2iwmdWefnOA6Z-_EkGoNfzCGnspOjpyDChA9DH";
  if (webhookUrl) {
    const embed = {
      username: 'Activity Log',
      avatar_url: 'https://yapton.vercel.app/cdn/image/logo.png',
      embeds: [
        {
          title: '📝 New Activity Submitted!',
          color: 0x283335,
          fields: [
            { name: 'Roblox username', value: `${user.username} (${user.robloxUsername || 'Unknown'})`, inline: false },
            { name: 'Date of activity logged', value: new Date(newLog.date).toISOString().split('T')[0], inline: false },
            { name: 'Time in', value: newLog.timeJoined || 'N/A', inline: true },
            { name: 'Time out', value: newLog.timeLeft || 'N/A', inline: true },
            { name: 'Total in-game', value: `${newLog.duration || 0}`, inline: false },
            { name: 'Did you host a Yapton shift as part of this activity?', value: newLog.host ? 'Yes' : 'No', inline: false },
            {
              name: 'Notes',
              value:
                Array.isArray(newLog.notes) && newLog.notes.length > 0
                  ? newLog.notes.map((n) => `• ${n.noteText}`).join('\n')
                  : 'None provided',
              inline: false,
            },
          ],
          footer: {
            text: 'Contact Code if broken',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    });
  } else {
    console.warn('⚠️ ACTIVITY_WEBHOOK_URL not set; skipping Discord post.');
  }
} catch (err) {
  console.error('❌ Failed to post Discord embed:', err);
}


      const subject = 'Activity Log Confirmation';
      const to = user.email;

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
                <h1 style="font-size: 24px; margin: 0; color: #ffffff;">New Activity Log Submitted</h1>
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
            An activity log has been submitted with the following details:
          </p>
          <table cellpadding="6" cellspacing="0" width="100%" style="font-size: 16px; line-height: 1.6;">
            <tr><td><strong>Date</strong></td><td>${new Date(newLog.date).toLocaleDateString('en-UK')}</td></tr>
            <tr><td><strong>Time Joined</strong></td><td>${newLog.timeJoined}</td></tr>
            <tr><td><strong>Time Left</strong></td><td>${newLog.timeLeft}</td></tr>
            <tr><td><strong>Duration</strong></td><td>${newLog.duration}</td></tr>
            <tr><td><strong>Description</strong></td><td>${newLog.description}</td></tr>
            <tr><td><strong>Notable</strong></td><td>${newLog.notable === 'Yes' ? 'Yes' : 'No'}</td></tr>
            <tr><td><strong>Logged At</strong></td><td>${new Date(newLog.createdAt).toLocaleString()}</td></tr>
          </table>
          <p style="font-size: 16px; line-height: 1.6;">
            If there are any issues with this log, please reach out to <a href="mailto:admin@flatstudios.net" style="color:#283335; text-decoration: underline;">admin@flatstudios.net</a>.
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
        to,
        subject,
        html,
      };

      await mailHub.sendMail(mailOptions);

      return res.status(201).json(newLog);
    } catch (error) {
      console.error('POST /api error:', error);
      return res.status(500).json({ error: 'Failed to create log' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
