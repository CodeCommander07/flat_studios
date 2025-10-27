import dbConnect from '@/utils/db';
import Appeal from '@/models/Appeals';
import nodemailer from 'nodemailer';
import axios from 'axios';

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'No appeal ID provided.' });

  if (req.method === 'PATCH') {
    const { status, denyReason } = req.body;

    if (!['Denied', 'Accepted', 'Flagged'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    try {
      // Fetch appeal first
      const appeal = await Appeal.findById(id);
      if (!appeal) return res.status(404).json({ error: 'Appeal not found.' });

      // Update fields
      appeal.status = status;
      if (status === 'Denied') appeal.denyReason = denyReason || 'N/A';
      await appeal.save(); // ensures actual write to DB

      if (status === 'Accepted') {
        try {
          const res = await axios.patch(
            `https://apis.roblox.com/cloud/v2/universes/2103484249/user-restrictions/${appeal.RobloxId}?updateMask=gameJoinRestriction`,
            {
              gameJoinRestriction: {
                active: false,
              }
            },
            {
              headers: {
                'x-api-key': process.env.ROBLOX_API_KEY,
                'Content-Type': 'application/json'
              }
            }
          );
          await axios.post('https://discord.com/api/webhooks/1286379949049254011/cxzcQmovsGnPfB-pHbUpdqtDqmJ3_-9uRT-KnfvQSTEToA6w4X55TLk9yeZKqLmYUd3U', {
            content: `:white_check_mark: Successfully unbanned **${appeal.RobloxUsername}** (ID: ${appeal.RobloxId}) from the game after their appeal was accepted.`
          });
        } catch (err) {
          console.error('Failed to unban user:', err.response?.data || err.message);
        }
      }

      // Send email (same as your current html generation)
      if (appeal.email) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });

        const appealDate = new Date(appeal.updatedAt || Date.now());
        const unbanDate = new Date(appealDate.getTime() + 72 * 60 * 60 * 1000);
        const formattedUnbanDate = unbanDate.toLocaleString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const statusMessage = status === 'Denied'
          ? `<p style="margin-top:20px;font-size:14px;">Unfortunately, your appeal has been denied.<br>Reason:<br><div style="border: 1px solid black; padding: 8px; border-radius: 8px; margin-top: 8px;">
  ${denyReason || 'N/A'}
</div></p>`
          : status === 'Flagged'
          ? `<p style="font-size: 16px; line-height: 1.5;">
                    Unfortunately, your appeal has been flagged for further review by our staff team.
                    <br><br>
                    This means that we require additional time to thoroughly assess your appeal and make a final decision.
                    <br><br>
                    We appreciate your patience and understanding during this process. Our team is committed to ensuring that all appeals are handled fairly and with due diligence.
                    <br><br>
                    You will be notified of the final decision regarding your appeal as soon as possible.
                    <br><br>
                    Thank you for your cooperation.
                  </p>` : (() => {
            // Create plain-text body with new lines encoded
            const mailBody = [
              'Hello,',
              '',
              `My ban appeal was accepted on ${new Date().toLocaleString('en-GB')}, but I haven't been unbanned from the game.`,
              `My Roblox Username is ${appeal.RobloxUsername}`,
              `My Discord Username is ${appeal.DiscordUsername}`,
              '',
              'This email was automatically generated on behalf of Yapton and District By Flat Studios.'
            ].join('%0D%0A'); // CRLF encoding for new lines

            const mailtoLink = `mailto:help@flatstudios.net?subject=Ban Appeal ${id}&body=${mailBody}`;

            return `<p style="margin-top:20px;font-size:14px;">
        Your appeal has been reviewed successfully. Please allow between <strong style="text-decoration: underline; color: orange; text-decoration-color: orange">48</strong> to <strong style="text-decoration: underline; color: orange; text-decoration-color: orange;">72</strong hours to be unbanned from the game. 
        <strong style="text-decoration: underline;"><br>This should be done automatically.<br></strong>
        If you have not been unbanned by 
        <strong style="text-decoration: underline; color: blue; text-decoration-color: blue;">${formattedUnbanDate}</strong>, then contact support by emailing: 
        <a href="${mailtoLink}" style="text-decoration: underline;">help@flatstudios.net</a>.
        <br>Click the email link to automatically generate an email with your details.
        <strong style="color: black; text-decoration: underline; text-decoration-color: #dc3545;"><br>
  Do not reply to this email. It has been generated as part of your appeal.
</strong>
      </p>`;
          })();

        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background-color:#f4f4f9;margin:0;padding:0;">
  <table align="center" cellpadding="0" cellspacing="0" width="600" style="margin:20px auto;background-color:#ffffff;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1);overflow:hidden;">
    <tr>
      <td style="background-color:#283335;color:#fff;padding:20px;">
        <h1 style="margin:0;font-size:20px;text-align:center;">Appeal Status: <strong style="color:${status === 'Accepted' ? '#28a745' : status === 'Flagged' ? '#c97b32' : '#dc3545'}">${status.toUpperCase()}</strong></h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px;">
        <p style="font-size:16px;">Hello,</p>
        <p style="font-size:16px;line-height:1.5;">Your appeal has been <strong style="color:${status === 'Accepted' ? '#28a745' : status === 'Flagged' ? '#c97b32' : '#dc3545'};">${status.toUpperCase()}</strong>.</p>

        <table style="width:100%;font-size:14px;margin-top:20px;margin-bottom:20px;">
          <tr ><td style="padding:8px 0;border-top:1px solid #eee;"><strong>Email:</strong></td><td style="padding:8px 0;border-top:1px solid #eee;"{appeal.email || '-'}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Discord:</strong></td><td style="padding:4px 0;">${appeal.DiscordUsername || '-'}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Roblox:</strong></td><td style="padding:4px 0;">${appeal.RobloxUsername || '-'}</td></tr>
          <tr ><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Staff Member:</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${appeal.staffMember || '-'}</td></tr>
        </table>

        <h3 style="margin-top:30px;font-size:16px;">Ban Details:</h3>
        <table style="width:100%;font-size:14px;border-spacing:0;border-collapse:collapse;">
          <tr><td><strong>Ban Date:</strong></td></tr>
          <tr><td>${new Date(appeal.banDate).toLocaleDateString('en-UK')}</td></tr>
          <tr><td><strong>Ban Reason:</strong></td></tr>
          <tr><td>${appeal.banReason || '-'}</td></tr>
          <tr><td style="padding:8px 0; border-top:1px solid #eee;"><strong>Unban Justification:</strong></td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;">${appeal.unbanReason || '-'}</td></tr>
        </table>

        ${statusMessage || ''}
        
        <p style="margin-top:20px;font-size:14px;">Thank you,<br>FlatStudios Team</p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding:10px;background-color:#f4f4f9;font-size:12px;color:#888;">
        This is an automated email. Yapton & District is a subsidiary of Flat Studios.
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        await transporter.sendMail({
          from: `"FlatStudios Team" <${process.env.MAIL_USER}>`,
          bcc: 'codecmdr.rblx@gmail.com',
          to: appeal.email,
          subject: `Your Appeal has been ${status}`,
          html,
        });
      }

      return res.status(200).json(appeal);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to update status.' });
    }
  } else {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
