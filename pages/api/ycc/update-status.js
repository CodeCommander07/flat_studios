import dbConnect from '@/utils/db';
import OperatorRequest from '@/models/OperatorRequest';
import nodemailer from 'nodemailer';

export const config = {
  api: {
    bodyParser: true,
  },
};

const NEW_ROUTE_QUESTIONS = [
  'Route Number',
  'Allocated/Recommended Vehicle',
  'Starting Location',
  'Via',
  'Finishing Location',
  'Upload Map',
];

const CHANGE_ROUTE_QUESTIONS = [
  'Route Number',
  'New Start Location',
  'New Via',
  'New Finish',
  'Details of Change',
  'New Map',
];

const mailHub = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  secure: true,
});

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { id, status } = req.body;
  if (!id || !['accepted', 'denied'].includes(status)) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  await dbConnect();

  try {
    const request = await OperatorRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    request.status = status;
    await request.save();

    const isNewRoute = request.routeSubmissionType === 'new';
    const questions = isNewRoute ? NEW_ROUTE_QUESTIONS : CHANGE_ROUTE_QUESTIONS;

    const baseUrl = process.env.BASE_URL || ''; // fallback to empty string if undefined

    const questionAnswersHtml = questions
      .map((q, idx) => {
        const answer =
          idx === 5 && request.mapFile
            ? `<a href="${baseUrl}/api/ycc/routes/file?id=${request._id}" target="_blank" rel="noopener noreferrer" style="color: #9900ff">View Map Here</a>`
            : request[`P3Q${idx + 1}`] || '-';

        return `
          <tr>
            <td style="padding: 8px 0;"><strong>${q}</strong></td>
            <td style="padding: 8px 0;">${answer}</td>
          </tr>
        `;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f9; margin: 0; padding: 0;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="margin: 20px auto; background-color: #ffffff; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
      <tr>
        <td style="background-color: #283335; color: #fff; padding: 20px;">
          <table width="100%">
            <tr>
              <td width="50">
                <img src="https://flat-studios.vercel.app/cdn/image/logo.png" alt="Logo" style="width: 50px; height: auto;">
              </td>
              <td align="center">
                <h1 style="margin: 0; font-size: 20px;">Route Request <strong style="color: ${
                  status === 'accepted' ? '#28a745' : '#dc3545'
                }">${status.toUpperCase()} </strong></h1>
              </td>
              <td width="50"></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 16px; line-height: 1.5;">
            The following route request has been <strong style="color: ${
              status === 'accepted' ? '#28a745' : '#dc3545'
            };">${status.toUpperCase()}</strong>.
          </p>

          <table style="width: 100%; font-size: 14px; margin-top: 20px;">
            <tr>
              <td style="padding: 6px 0;"><strong>Email:</strong></td>
              <td>${request.email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0;"><strong>Discord:</strong></td>
              <td>${request.discordTag}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0;"><strong>Company:</strong></td>
              <td>${request.selectedCompany}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0;"><strong>Submission Type:</strong></td>
              <td>${request.routeSubmissionType}</td>
            </tr>
          </table>

          <h3 style="margin-top: 30px; font-size: 16px;">Submitted Answers:</h3>
          <table style="width: 100%; font-size: 14px; border-spacing: 0;">
            ${questionAnswersHtml}
          </table>
          <p style="margin-top: 20px; font-size: 14px;">Thank you,<br>FlatStudios Team</p>
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 10px; background-color: #f4f4f9; font-size: 12px; color: #888;">
          This is an automated email. Yapton & District is a subsidiary of Flat Studios.
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const mailOptions = {
      from: '"FlatStudios" <no-reply@flatstudios.net>',
      to: 'admin@flatstudios.net',
      bcc: request.email,
      subject: `Route Request ${status.toUpperCase()}: ${request.selectedCompany}`,
      html,
    };

    await mailHub.sendMail(mailOptions);

    return res.status(200).json({ message: `Request ${status} successfully.` });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
