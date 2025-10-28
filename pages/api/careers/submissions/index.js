import dbConnect from '@/utils/db';
import SubmittedApplication from '@/models/SubmittedApplication';
import Application from '@/models/ApplicationForm';
import nodemailer from 'nodemailer';
import cron from 'node-cron'; // ✅ added

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const subs = await SubmittedApplication.find().populate('applicationId');
    return res.json(subs);
  }

  if (req.method === 'POST') {
    try {
      const { applicationId, applicantEmail, answers } = req.body;

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

        let userAnswer = userAnswerObj?.answer || '';
        // Normalize checkbox arrays -> lowercase strings for comparison
        if (Array.isArray(userAnswer)) {
          userAnswer = userAnswer.map((ans) => ans.trim().toLowerCase());
        } else {
          userAnswer = userAnswer.trim().toLowerCase();
        }


        // Ensure acceptedAnswers is an array
        const accepted = Array.isArray(question.acceptedAnswers)
          ? question.acceptedAnswers
          : typeof question.acceptedAnswers === 'string'
            ? [question.acceptedAnswers]
            : [];

        if (question.autoDeny && accepted.length > 0) {
          const validAnswers = accepted.map((a) => a.trim().toLowerCase());
          const normalized = userAnswer.toLowerCase();

          // ✅ handle both array and single answers correctly
          const match =
            Array.isArray(userAnswer)
              ? userAnswer.some((ans) => validAnswers.includes(ans))
              : validAnswers.includes(userAnswer);

          if (!match) {
            deniedReason = `Auto-denied: "${Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer}" failed for question "${question.label}".`;
            break;
          }

        }
      }
      // Determine status
      const status = deniedReason ? 'denied' : 'pending';

      // Create submission record
      // 🧩 Enrich answers with their question labels
      const enrichedAnswers = answers.map((a) => {
        const question = app.questions.find(
          (q) => q._id.toString() === a.questionId || q.id === a.questionId
        );
        return {
          questionLabel: question?.label || 'Unknown Question',
          answer: a.answer,
        };
      });

      // Create submission record
      const sub = new SubmittedApplication({
        applicationId,
        applicantEmail,
        answers: enrichedAnswers,
        status: "pending",
        notes: [],
        thankYouSent: true,
      });

      await sub.save();

      if (deniedReason) {
        setTimeout(async () => {
          sub.denyReason = sub.denyReason || 'Automatically denied by system review.';
          sub.status = 'denied';

          sub.notes.push({
            staffMember: '68f94e6aea94abc88941a751',
            noteText: sub.denyReason,
            status: 'denied',
            system: true,
          });
          await sub.save();

          const statusMessage = `
            <p style="font-size:16px;line-height:1.5;">
              Unfortunately, after reviewing your application, we’ve decided not to move forward at this time.
              Please don’t be discouraged — you’re welcome to apply again in the future if your circumstances change.
            </p>
            <p style="font-size:15px;line-height:1.6;margin-top:10px;">
              If you’d like more information about the decision or wish to appeal, you can contact our recruitment team at 
              <a href="mailto:hiring@flatstudios.net" style="color:#007BFF;text-decoration:none;">hiring@flatstudios.net</a>.
            </p>
          `;

          const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background-color:#f4f4f9;margin:0;padding:0;">
  <table align="center" cellpadding="0" cellspacing="0" width="600"
    style="margin:20px auto;background-color:#ffffff;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1);overflow:hidden;">
    <tr>
      <td style="background-color:#283335;color:#fff;padding:20px;">
        <h1 style="margin:0;font-size:20px;text-align:center;">
          Application Status: <strong style="color:#dc3545;">DENIED</strong>
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px;">
        <p style="font-size:16px;">Hello ${sub.applicantEmail},</p>
        <p style="font-size:16px;">Your application for <strong>${sub.applicationId?.title || 'a position'}</strong> has been <strong style="color:#dc3545;">DENIED</strong>.</p>
        ${statusMessage}
        <p style="margin-top:20px;font-size:14px;">Reason: ${sub.denyReason}</p>
        <p style="margin-top:20px;font-size:14px;">Thank you,<br>FlatStudios Team</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

          await transporter.sendMail({
            from: `"Hiring Team" <${process.env.MAIL_USER}>`,
            to: sub.applicantEmail,
            replyTo: 'hiring@flatstudios.net',
            subject: `Application Update – ${sub.applicationId?.title || 'Application'}`,
            html,
          });
        }, 5 * 60 * 1000);
      }

      // --- ✉️ THANK-YOU EMAIL (immediate) ---

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
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background-color:#f4f4f9;margin:0;padding:0;">
  <table align="center" cellpadding="0" cellspacing="0" width="600"
    style="margin:20px auto;background-color:#ffffff;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1);overflow:hidden;">
    <tr>
      <td style="background-color:#283335;color:#fff;padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:22px;">Thank You for Applying!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px;">
        <p style="font-size:16px;line-height:1.6;">
          Hello ${applicantEmail},
        </p>
        <p style="font-size:16px;line-height:1.6;">
          We’ve received your application for <strong>${app.title}</strong>.
          Our team will review it shortly and you’ll receive another email once a decision has been made.
        </p>
        <p style="margin-top:20px;font-size:14px;">
          Thank you,<br><strong>FlatStudios Recruitment Team</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding:10px;background-color:#f4f4f9;font-size:12px;color:#888;">
        This is an automated email. Please do not reply.
      </td>
    </tr>
  </table>
</body>
</html>`;

      await transporter.sendMail({
        from: `"Hiring Team" <${process.env.MAIL_USER}>`,
        to: applicantEmail,
        replyTo: "hiring@flatstudios.net",
        subject: `Application Received – ${app.title}`,
        html,
      });


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