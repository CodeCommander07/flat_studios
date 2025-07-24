import { IncomingForm } from 'formidable';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import dbConnect from '@/utils/db';
import OperatorRequest from '@/models/OperatorRequest';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

const mailHub = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  secure: true,
});

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

const parseForm = (req) => {
  const uploadDir = path.join(process.cwd(), 'storage/ycc/routes');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      keepExtensions: true,
      uploadDir,
      multiples: false,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

const flattenFields = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([key, val]) => [key, Array.isArray(val) ? val[0] : val]));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { fields, files } = await parseForm(req);
    const flatFields = flattenFields(fields);

    await dbConnect();

    const {
      email,
      discordTag,
      selectedCompany,
      routeSubmissionType,
      P3Q1,
      P3Q2,
      P3Q3,
      P3Q4,
      P3Q5,
    } = flatFields;

    let mapFileName = '';

    // Handle mapFile - support array or single object
    let mapFileObj = null;
    if (files?.mapFile) {
      mapFileObj = Array.isArray(files.mapFile) ? files.mapFile[0] : files.mapFile;
    }

    if (mapFileObj && mapFileObj.filepath) {
      // Create a unique filename to avoid overwrites
      const originalName = mapFileObj.originalFilename || path.basename(mapFileObj.filepath);
      const uniqueName = `${Date.now()}-${uuidv4()}-${originalName}`;
      const targetPath = path.join(process.cwd(), 'storage/ycc/routes', uniqueName);

      await fsp.rename(mapFileObj.filepath, targetPath);
      mapFileName = uniqueName;
    }

    const requestData = {
      email,
      discordTag,
      selectedCompany,
      routeSubmissionType,
      P3Q1,
      P3Q2,
      P3Q3,
      P3Q4,
      P3Q5,
      mapFileName,
    };

    await OperatorRequest.create(requestData);

    const generateEmailHTML = (request) => {
      const isNewRoute = request.routeSubmissionType === 'new';
      const questions = isNewRoute ? NEW_ROUTE_QUESTIONS : CHANGE_ROUTE_QUESTIONS;

      const questionAnswers = questions
        .map((q, idx) => {
          if (idx === 5 && request.mapFileName) {
            return `
              <strong>${q}</strong><br/>
              <a href="${process.env.BASE_URL}/files/ycc/routes/${request.mapFileName}" target="_blank" rel="noopener noreferrer" style="color: #9900ff;">View Map Here</a>
            `;
          }
          const answer = request[`P3Q${idx + 1}`] || '-';
          return `<strong>${q}</strong><br/>${answer}`;
        })
        .join('<br/>');

      return `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <tr>
        <td style="padding: 20px; background-color: #283335; color: #ffffff;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" style="vertical-align: middle; width: 50px;">
                <img src="https://flat-studios.vercel.app/cdn/image/logo.png" alt="Flat Studios Logo" style="max-width: 50px; height: auto;">
              </td>
              <td align="center" style="vertical-align: middle;">
                <h1 style="font-size: 24px; margin: 0; color: #ffffff;">Route Request</h1>
              </td>
              <td style="width: 50px;"></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <p style="font-size: 18px;">Hi <strong>${request.discordTag}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>Email:</strong> ${request.email}<br>
            <strong>Discord:</strong> ${request.discordTag}<br>
            <strong>Company:</strong> ${request.selectedCompany}<br>
            <strong>Submission Type:</strong> ${request.routeSubmissionType}
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            ${questionAnswers}
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            If you have any questions, please contact <a href="mailto:admin@flatstudios.net" style="color: #283335; text-decoration: underline;">admin@flatstudios.net</a>.
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 20px; background-color: #f4f4f9;">
          <p style="font-size: 14px;">Regards,<br><strong>Flat Studios Admin Team</strong></p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 10px; background-color: #f4f4f9;">
          <p style="font-size: 12px; color: #888;">This is an automated email. Flat Studios &copy; 2025.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
    };

    const mailOptions = {
      from: '"FlatStudios" <no-reply@flatstudios.net>',
      to: 'admin@flatstudios.net',
      bcc: email,
      subject: `Route Requested for ${selectedCompany}`,
      html: generateEmailHTML(requestData),
    };

    await mailHub.sendMail(mailOptions);

    return res.status(201).json({ message: 'Request saved and email sent.' });
  } catch (error) {
    console.error('Error in /api/ycc:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
