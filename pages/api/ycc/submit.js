import dbConnect from '@/utils/db';
import OperatorRequest from '@/models/OperatorRequest';
import Question from '@/models/YCCRouteForm'; // 👈 your questions collection
import nodemailer from 'nodemailer';

export const config = { api: { bodyParser: true } };

const mailHub = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  secure: true,
});

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    await dbConnect();

    // Form data from the client
    const submission = req.body;

    // 1️⃣ Fetch all questions for label lookup
    const allQuestions = await Question.find({}, '_id label page pageTitle').lean();
    const questionMap = Object.fromEntries(
      allQuestions.map((q) => [q._id.toString(), q])
    );

    // 2️⃣ Build structured responses by page
    const grouped = {};
    for (const [id, answer] of Object.entries(submission)) {
      const q = questionMap[id];
      if (!q) continue;

      const page = q.page || 1;
      const pageTitle = q.pageTitle || `Page ${page}`;
      if (!grouped[page])
        grouped[page] = { title: pageTitle, items: [] };

      grouped[page].items.push({
        id,
        label: q.label,
        answer,
      });
    }

    // 3️⃣ Extract key fields (email, name, company, etc.)
    const email =
      Object.values(submission).find((v) => /@/.test(v)) ||
      'unknown@flatstudios.net';
    const discordTag =
      Object.values(submission).find((v) => v.includes('#') || /^[A-Za-z0-9]+$/.test(v)) ||
      'Unknown User';
    const selectedCompany =
      Object.values(submission).find((v) =>
        /(buses|transport|company)/i.test(v)
      ) || 'Unknown Company';

    // 4️⃣ Save to DB (with grouped and raw)
    const saved = await OperatorRequest.create({
      formData: submission,
      structured: grouped,
      createdAt: new Date(),
    });

    // 5️⃣ Build HTML email
    const sections = Object.values(grouped)
      .map(
        (pg) => `
        <h3 style="margin-top:20px;">${pg.title}</h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          ${pg.items
            .map(
              (i) => `
              <tr>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;">
                  <strong>${i.label}</strong>
                </td>
                <td style="padding:6px 8px;border-bottom:1px solid #eee;">
                  ${i.answer || '-'}
                </td>
              </tr>`
            )
            .join('')}
        </table>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f4f9;margin:0;padding:0;">
  <table align="center" cellpadding="0" cellspacing="0" width="600"
    style="margin:20px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
    <tr>
      <td style="background:#283335;color:#fff;padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:20px;">YCC Route Request Submitted</h1>
      </td>
    </tr>
    <tr><td style="padding:20px;">
      <p>Hello <strong>${discordTag}</strong>,</p>
      <p>Your route request for <strong>${selectedCompany}</strong> has been received.</p>
      ${sections}
      <p style="margin-top:20px;">Thank you,<br>FlatStudios Team</p>
    </td></tr>
  </table>
</body>
</html>`;

    // 6️⃣ Send email
    await mailHub.sendMail({
      from: '"FlatStudios" <no-reply@flatstudios.net>',
      to: 'admin@flatstudios.net',
      bcc: email,
      subject: `YCC Route Submission from ${selectedCompany}`,
      html,
    });

    res.status(201).json({
      success: true,
      message: 'Submission saved and emailed successfully.',
      id: saved._id,
    });
  } catch (err) {
    console.error('Submit error:', err);
    res
      .status(500)
      .json({ success: false, error: err.message || 'Internal Server Error' });
  }
}
