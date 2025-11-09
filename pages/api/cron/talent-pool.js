import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import Submission from '@/models/SubmittedApplication';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    await dbConnect();

    // Find submissions in the talent pool
    const talentPoolSubs = await Submission.find({ status: 'talented' });
    console.log(`Found ${talentPoolSubs.length} talent pool submissions`);

    if (!talentPoolSubs.length) {
      return NextResponse.json({ message: 'No talent pool submissions found' });
    }

    // Create email transporter
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    let emailCount = 0;

    // Loop through each submission and send email
    for (const sub of talentPoolSubs) {
      if (!sub.applicantEmail) continue;

      const title = sub.applicationId?.title || 'a position';
      const recipientName = sub.applicantName || sub.applicantEmail || 'Applicant';

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="font-family:Arial,sans-serif;background-color:#f4f4f9;margin:0;padding:0;">
  <table align="center" cellpadding="0" cellspacing="0" width="600"
    style="margin:20px auto;background-color:#ffffff;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1);overflow:hidden;">
    <tr>
      <td style="background-color:#283335;color:#fff;padding:20px;">
        <h1 style="margin:0;font-size:20px;text-align:center;">
          Application Status: <strong style="color:#f0ad4e;">TALENT POOL</strong>
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px;">
        <p style="font-size:16px;">Hello ${recipientName},</p>
        <p style="font-size:16px; line-height:1.5;">
          Your application for <strong>${title}</strong> has been moved to our
          <strong style="color:#f0ad4e;">Talent Pool</strong>.
        </p>
        <p style="font-size:16px; line-height:1.5; margin:16px 0;">
          This means we think you could be a great fit for future opportunities.
          We don’t have an immediate opening right now, but we’ll keep your details on file and
          reach out if a suitable role becomes available.
        </p>
        <p style="font-size:14px; color:#6b7280; margin-top:20px;">
          There’s no action needed from you at this time. If your situation changes,
          feel free to reply to this email with an updated CV or availability.
        </p>
        <p style="margin-top:24px;font-size:14px;">
          Thank you for your patience and interest in joining us,<br/>
          <strong>FlatStudios Team</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f9fafb; color:#6b7280; padding:14px 20px; font-size:12px; text-align:center;">
        This is an automated message. If you have questions, reply to this email and our team will get back to you.
      </td>
    </tr>
  </table>
</body>
</html>
`;

      await transporter.sendMail({
        from: `"FlatStudios Team" <${process.env.MAIL_USER}>`,
        to: sub.applicantEmail,
        cc: 'hiring@flatstudios.net',
        replyTo: 'hiring@flatstudios.net',
        subject: `Talent Pool Update – ${title}`,
        html,
      });


      emailCount++;
    }

    return NextResponse.json({
      message: `Talent pool check completed. ${emailCount} emails sent.`
    });
  } catch (error) {
    console.error('Error in talent pool cron job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';