import dbConnect from '@/utils/db';
import Submission from '@/models/SubmittedApplication'; // your submissions model
import ApplicationForm from '@/models/ApplicationForm'; // your application form model
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    await dbConnect();

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'No submission ID provided.' });

    if (req.method === 'PATCH') {
        let { status, denyReason } = req.body;

        if (!['denied', 'accepted', 'talented'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value.' });
        }

        try {
            // Fetch submission
            const submission = await Submission.findById(id);
            if (!submission) return res.status(404).json({ error: 'Submission not found.' });

            // Fetch related application details
            const application = await ApplicationForm.findById(submission.applicationId);
            console.log(application) // assuming submission has applicationId
            const applicationName = application ? application.title : 'Operations Manager';

            // Update submission fields
            submission.status = status;
            if (status === 'denied') submission.denyReason = denyReason || 'N/A';
            await submission.save();
            if (status === 'talented') status = 'Held';

            // Send email if email exists
            if (submission.applicantEmail) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
                });

                const statusMessage =
                    status === 'denied'
                        ? denyReason ?  `<p style="margin-top:20px;font-size:14px;">Unfortunately, your application for <strong>${applicationName}</strong> has been denied.<br>Reason:<br><div style="border: 1px solid black; padding: 8px; border-radius: 8px; margin-top: 8px;">
  ${denyReason || ""}
</div></p>`:`<p style="margin-top:20px;font-size:14px;">Thank you for submitting your application for the ${applicationName} position at Yapton & District.<br /><br />

Unfortunately, your application has not been successful at this time. We encourage you to reapply in the future if your circumstances change.</p>`
                        : status === 'Held'
                            ? `<p style="font-size: 16px; line-height: 1.5;">
                    We're pleased to inform you that we've moved your application for <strong>${applicationName}</strong> to our talent pool. While we don't have a spot for you on the team just yet, we're excited about the possibility of having you on board in the future. When we have a vacancy or a final decision regarding your application, we will reach out via email — so please keep an eye on your inbox, including your spam and junk folders.
                  </p>`
                            : `<p style="margin-top:20px;font-size:14px;">
Congratulations! We are pleased to inform you that your application for the ${applicationName} position at Yapton & District has been accepted.<br /><br />

Further details will be provided in the Yapton & District Community Server. Make sure you have all channels visible to ensure you don't miss anything!<br /><br />

Welcome to the team! <br /><br />

Please check your emails for further updates.
      </p>`;

                const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background-color:#f4f4f9;margin:0;padding:0;">
  <table align="center" cellpadding="0" cellspacing="0" width="600" style="margin:20px auto;background-color:#ffffff;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1);overflow:hidden;">
    <tr>
      <td style="background-color:#283335;color:#fff;padding:20px;">
        <h1 style="margin:0;font-size:20px;text-align:center;">Application Status: <strong style="color:${status === 'accepted' ? '#28a745' : status === 'Held' ? '#c97b32' : '#dc3545'}">${status.toUpperCase()}</strong></h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px;">
        <p style="font-size:16px;">Hello,</p>
        <p style="font-size:16px;line-height:1.5;">Your Application has been <strong style="color:${status === 'accepted' ? '#28a745' : status === 'Held' ? '#c97b32' : '#dc3545'};">${status.toUpperCase()}</strong>.</p>
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
                    to: submission.applicantEmail,
                    subject: `Your Submission for ${applicationName} has been ${status}`,
                    html,
                });
            }

            return res.status(200).json(submission);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to update status.' });
        }
    } else {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
