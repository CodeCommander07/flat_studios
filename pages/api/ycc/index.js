import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dbConnect from '@/utils/db';
import OperatorRequest from '@/models/OperatorRequest';
import nodemailer from 'nodemailer';

const mailHub = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  secure: true,
});

// Disable Next.js default body parsing so multer can handle it
export const config = {
  api: {
    bodyParser: false,
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

// Setup multer storage
const storageFolder = path.join(process.cwd(), 'storage/ycc/routes');
fs.mkdirSync(storageFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `map-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

// Utility to run multer middleware manually
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) reject(result);
      else resolve(result);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run multer middleware to handle file upload
    await runMiddleware(req, res, upload.single('mapFile'));

    await dbConnect();

    // multer attaches text fields in req.body, file info in req.file
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
    } = req.body;
    // Validate required fields
    if (
      !email ||
      !discordTag ||
      !selectedCompany ||
      !routeSubmissionType ||
      !P3Q1 ||
      !P3Q2 ||
      !P3Q4 ||
      !P3Q5
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Map file is required' });
    }

    const newRequest = new OperatorRequest({
      email,
      discordTag,
      selectedCompany,
      routeSubmissionType,
      P3Q1,
      P3Q2,
      P3Q3,
      P3Q4,
      P3Q5,
      mapFileName: req.file.filename,
    });

    const request = {
      email,
      discordTag,
      selectedCompany,
      routeSubmissionType,
      P3Q1,
      P3Q2,
      P3Q3,
      P3Q4,
      P3Q5,
      mapFileName: req.file.filename,
    }

    await newRequest.save();
    const html = (request, status) => {
      // Determine if new or change for question set
      const isNewRoute = request.routeSubmissionType === 'new';
      const questions = isNewRoute ? NEW_ROUTE_QUESTIONS : CHANGE_ROUTE_QUESTIONS;

      // Build question answers with special link for map file (last question)
      const questionAnswers = questions.map((q, idx) => {
        if (idx === 5 && request.mapFileName) {
          return `
        <strong>${q}</strong><br/>
        <a href="${process.env.BASE_URL}/files/ycc/routes/${request.mapFileName}" target="_blank" rel="noopener noreferrer" style="color: #9900ff;">View Map Here</a>
      `;
        }
        const answer = request[`P3Q${idx + 1}`] || '-';
        return `<strong>${q}</strong><br/>${answer}`;
      }).join('<br/>');

      return `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <tr>
        <td style="padding: 20px; background-color: #283335; color: #ffffff;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" style="vertical-align: middle; width: 50px;">
                <img src="https://flat-studios.vercel.app/cdn/image/logo.png" alt="Flat Studios Logo" style="max-width: 50px; height: auto; margin-right: 10px;">
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
          </p>

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
      html: html(request),
    };

    await mailHub.sendMail(mailOptions);

    return res.status(201).json({ message: 'Request saved successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
