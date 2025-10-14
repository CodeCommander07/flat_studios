import { IncomingForm } from 'formidable';
import fs from 'fs';
import dbConnect from '@/utils/db';
import OperatorRequest from '@/models/OperatorRequest';
import BusRoutes from '@/models/BusRoutes';
import BusStops from '@/models/BusStops';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

export const config = { api: { bodyParser: false } };

const mailHub = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
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

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true, multiples: false });
    form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });

const flattenFields = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

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

    // Handle uploaded map
    let mapFileData = null;
    if (files?.mapFile) {
      const fileObj = Array.isArray(files.mapFile) ? files.mapFile[0] : files.mapFile;
      if (fileObj.filepath) {
        const buffer = fs.readFileSync(fileObj.filepath);
        mapFileData = { data: buffer, contentType: fileObj.mimetype || 'application/octet-stream', filename: `${Date.now()}-${uuidv4()}-${fileObj.originalFilename}` };
        try { fs.unlinkSync(fileObj.filepath); } catch (e) { console.warn(e); }
      }
    }

    // Save to DB
    const newRequest = await OperatorRequest.create({ ...flatFields, mapFile: mapFileData });

    // --- Fetch all stops and create a map for names ---
    const allStops = await BusStops.find({});
    const stopMap = Object.fromEntries(allStops.map(s => [s.stopId, s.name]));
    const getStopName = (stopId) => (!stopId ? '-' : stopMap[stopId] || stopId);

    // --- Fetch route info if route exists ---
    const routeForDisplay = await BusRoutes.findOne({ routeId: P3Q1 });

    // Build question answers HTML with resolved stop names
    const questions = routeSubmissionType === 'new' ? NEW_ROUTE_QUESTIONS : CHANGE_ROUTE_QUESTIONS;

    const questionAnswersHtml = questions.map((q, idx) => {
      let answer = newRequest[`P3Q${idx + 1}`] || '-';

      // Map stop IDs to names for location fields
      if (/location|via|finish/i.test(q)) {
        if (Array.isArray(answer)) answer = answer.map(getStopName).join(', ');
        else if (typeof answer === 'string') answer = answer.includes(',') ? answer.split(',').map(s => getStopName(s.trim())).join(', ') : getStopName(answer);
      }

      if ((/map/i.test(q) || idx === 5) && mapFileData) {
        const fileLink = `${process.env.BASE_URL}/api/ycc/routes/file?id=${newRequest._id}`;
        answer = `<a href="${fileLink}" target="_blank" rel="noopener noreferrer" style="color: #9900ff">View Map Here</a>`;
      }

      if (/route number/i.test(q) && routeForDisplay?.number) answer = routeForDisplay.number;

      return `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>${q}</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${answer}</td></tr>`;
    }).join('');

    // Build old route HTML for change requests
    let oldRouteHtml = '';
    if (routeSubmissionType === 'change' && routeForDisplay) {
      const oldStops = routeForDisplay.stops.map(getStopName).join(', ');
      const oldOrigin = getStopName(routeForDisplay.origin);
      const oldDestination = getStopName(routeForDisplay.destination);
      const mapLink = routeForDisplay.mapFile ? `<a href="${process.env.BASE_URL}/api/ycc/routes/file?id=${routeForDisplay._id}" target="_blank" style="color:#9900ff">View Current Map</a>` : '-';

      oldRouteHtml = `
        <table style="width:100%;font-size:14px;border-spacing:0;border-collapse:collapse;">
          <tr><td><strong>Route Number</strong></td><td>${routeForDisplay.number || '-'}</td></tr>
          <tr><td><strong>Origin</strong></td><td>${oldOrigin}</td></tr>
          <tr><td><strong>Via</strong></td><td>${oldStops}</td></tr>
          <tr><td><strong>Destination</strong></td><td>${oldDestination}</td></tr>
          <tr><td><strong>Current Map</strong></td><td>${mapLink}</td></tr>
        </table>`;
    }

    const html = `<!DOCTYPE html>
<html>
  <body style="font-family:Arial,sans-serif;background-color:#f4f4f9;margin:0;padding:0;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="margin:20px auto;background-color:#ffffff;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1);overflow:hidden;">
      <tr>
        <td style="background-color:#283335;color:#fff;padding:20px;text-align:center;">
          <h1 style="margin:0;font-size:20px;">Route Request Submitted</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;">
          <p>Hello <strong>${discordTag}</strong>,</p>
          <p>Your route request has been submitted. Details:</p>

          <table style="width:100%;font-size:14px;margin-top:20px;margin-bottom:20px;">
            <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
            <tr><td><strong>Discord:</strong></td><td>${discordTag}</td></tr>
            <tr><td><strong>Company:</strong></td><td>${selectedCompany}</td></tr>
            <tr><td><strong>Submission Type:</strong></td><td>${routeSubmissionType}</td></tr>
          </table>

          ${oldRouteHtml ? `<h3>Old Route:</h3>${oldRouteHtml}` : ''}

          <h3>Submitted Answers:</h3>
          <table style="width:100%;font-size:14px;border-spacing:0;border-collapse:collapse;">
            ${questionAnswersHtml}
          </table>

          <p>Thank you,<br>FlatStudios Team</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    await mailHub.sendMail({
      from: '"FlatStudios" <no-reply@flatstudios.net>',
      to: 'admin@flatstudios.net',
      bcc: email,
      subject: `Route Request Submitted for ${selectedCompany}`,
      html,
    });

    return res.status(201).json({ message: 'Request saved and email sent.' });
  } catch (err) {
    console.error('Error in /api/ycc:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
