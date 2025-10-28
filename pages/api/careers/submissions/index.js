import dbConnect from '@/utils/db';
import SubmittedApplication from '@/models/SubmittedApplication';
import Application from '@/models/ApplicationForm';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const subs = await SubmittedApplication.find().populate('applicationId');
    return res.json(subs);
  }

  if (req.method === 'POST') {
    try {
      const { applicationId, answers } = req.body;

      if (!applicationId || !answers) {
        return res.status(400).json({ error: 'Missing applicationId or answers' });
      }

      // 🔹 Fetch the application form
      const app = await Application.findById(applicationId);
      if (!app) {
        return res.status(404).json({ error: 'Application form not found' });
      }

      // --- 🧠 AUTO-DENY CHECK ---
      let deniedReason = null;

      for (const question of app.questions || []) {
        const qLabel = (question.label || '').trim().toLowerCase();

        // Find answer by comparing label case-insensitively
        const userAnswerObj = answers.find(
          (a) => (a.questionLabel || '').trim().toLowerCase() === qLabel
        );

        const userAnswer = (userAnswerObj?.answer || '').trim();

        // Ensure acceptedAnswers is an array
        const accepted = Array.isArray(question.acceptedAnswers)
          ? question.acceptedAnswers
          : typeof question.acceptedAnswers === 'string'
          ? [question.acceptedAnswers]
          : [];

        if (question.autoDeny && accepted.length > 0) {
          const validAnswers = accepted.map((a) => a.trim().toLowerCase());
          const normalized = userAnswer.toLowerCase();

          if (!validAnswers.includes(normalized)) {
            deniedReason = `Auto-denied: "${userAnswer}" failed rule for question "${question.label}".`;
            break;
          }
        }
      }

      // Determine status
      const status = deniedReason ? 'denied' : 'pending';

      // Create submission record
      const sub = new SubmittedApplication({
        applicationId,
        applicantEmail,
        applicantName,
        answers,
        status,
        denyReason: deniedReason || null,
        notes: [],
      });

      // --- 🗒️ Add system note if denied ---
      if (status === 'denied') {
        sub.notes.push({
          staffMember: '68f94e6aea94abc88941a751',
          noteText: deniedReason,
          status: 'denied',
          system: true,
        });
      }

      await sub.save();

      // --- ✉️ AUTO-DENY EMAIL ---
      if (status === 'denied' && applicantEmail) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });

        const statusMessage = `
          <p style="font-size:16px;line-height:1.5;">
            Unfortunately, after reviewing your application, we’ve decided not to move forward at this time.
            Please don’t be discouraged — you’re welcome to apply again in the future if your circumstances change.
          </p>
        `;

        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background-color:#f4f4f9;margin:0;padding:0;">
  <table align="center" cellpadding="0" cellspacing="0" width="600" style="margin:20px auto;background-color:#ffffff;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1);overflow:hidden;">
    <tr>
      <td style="background-color:#283335;color:#fff;padding:20px;">
        <h1 style="margin:0;font-size:20px;text-align:center;">
          Application Status: <strong style="color:#dc3545;">DENIED</strong>
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px;">
        <p style="font-size:16px;">Hello${applicantName ? ` ${applicantName}` : ''},</p>
        <p style="font-size:16px;line-height:1.5;">
          Your application for <strong>${app.title}</strong> has been <strong style="color:#dc3545;">DENIED</strong>.
        </p>
        ${statusMessage}
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
</html>`;
        await transporter.sendMail({
          from: `"FlatStudios Team" <${process.env.MAIL_USER}>`,
          to: applicantEmail,
          subject: `Application Update – ${app.title}`,
          html,
        });
      }

      // ✅ Respond
      return res.status(201).json({
        success: true,
        status,
        ...(deniedReason ? { denyReason: deniedReason } : {}),
        submission: sub,
      });
    } catch (err) {
      console.error('Application submission failed:', err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
