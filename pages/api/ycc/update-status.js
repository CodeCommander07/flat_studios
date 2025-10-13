import dbConnect from '@/utils/db';
import OperatorRequest from '@/models/OperatorRequest';
import BusRoutes from '@/models/BusRoutes';
import BusStops from '@/models/BusStops';
import nodemailer from 'nodemailer';

export const config = { api: { bodyParser: true } };

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
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  secure: true,
});

// Helper function to update route
async function updateRoute(route, request) {
  const start = request.P3Q2;
  const via = Array.isArray(request.P3Q3)
    ? request.P3Q3
    : typeof request.P3Q3 === 'string'
    ? request.P3Q3.split(',').map(s => s.trim())
    : [];
  const finish = request.P3Q4;

  const stopsArray = [start, ...via, finish].filter(Boolean);

  route.origin = start;
  route.destination = finish;
  route.stops = stopsArray;
  if (request.mapFile) route.mapFile = request.mapFile;

  await route.save();

  for (const stopId of stopsArray) {
    await BusStops.updateOne({ stopId }, { $addToSet: { routes: route.routeId } });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, status } = req.body;
  if (!id || !['accepted', 'denied'].includes(status))
    return res.status(400).json({ error: 'Invalid data' });

  await dbConnect();

  try {
    const request = await OperatorRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    request.status = status;
    await request.save();

    const isNewRoute = request.routeSubmissionType === 'new';
    const baseUrl = process.env.BASE_URL || '';
    const questions = isNewRoute ? NEW_ROUTE_QUESTIONS : CHANGE_ROUTE_QUESTIONS;

    // Fetch stops for name mapping
    const allStops = await BusStops.find({});
    const stopMap = Object.fromEntries(allStops.map(s => [s.stopId, s.name]));

    // Helper function to convert stop IDs to names
    const getStopName = (stopId) => {
      if (!stopId) return '-';
      return stopMap[stopId] || stopId; // Return name if found, otherwise return the ID
    };

    // Get route for display
    let routeForDisplay = null;
    routeForDisplay = await BusRoutes.findOne({ routeId: request.P3Q1 });

    // Build question answers synchronously
    const questionAnswersHtml = questions.map((q, idx) => {
      const questionIndex = idx + 1;
      let answer = request[`P3Q${questionIndex}`];
      
      // Handle empty answers
      if (answer === undefined || answer === null) {
        answer = '-';
      }

      // Route Number - use display route if available
      if (q.toLowerCase().includes('route number')) {
        if (routeForDisplay && routeForDisplay.number) {
          answer = routeForDisplay.number;
        } else {
          answer = request.P3Q1 || '-';
        }
      }

      // Convert stop IDs to names for location fields
      if (q.toLowerCase().includes('location') || q.toLowerCase().includes('via') || q.toLowerCase().includes('finish')) {
        if (Array.isArray(answer)) {
          // For array fields like "Via" - convert each stop ID to name
          answer = answer.map(stopId => getStopName(stopId)).join(', ');
        } else if (typeof answer === 'string') {
          // For string fields - check if it's a stop ID and convert
          // If it contains commas, it might be multiple stops
          if (answer.includes(',')) {
            answer = answer.split(',').map(stopId => getStopName(stopId.trim())).join(', ');
          } else {
            answer = getStopName(answer);
          }
        }
      }

      // Handle array answers (convert to string)
      if (Array.isArray(answer)) {
        answer = answer.join(', ');
      }

      // Handle map file links
      if ((q.toLowerCase().includes('map') || questionIndex === 6) && request.mapFile) {
        answer = `<a href="${baseUrl}/api/ycc/routes/file?id=${request._id}" target="_blank" rel="noopener noreferrer" style="color: #9900ff">View Map Here</a>`;
      }

      return `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${q}</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${answer}</td></tr>`;
    }).join('');

    // Send email
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f9; margin: 0; padding: 0;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="margin: 20px auto; background-color: #ffffff; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
      <tr>
        <td style="background-color: #283335; color: #fff; padding: 20px;">
          <h1 style="margin: 0; font-size: 20px; text-align:center;">Route Request <strong style="color: ${status === 'accepted' ? '#28a745' : '#dc3545'}">${status.toUpperCase()}</strong></h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 16px; line-height: 1.5;">
            The following route request has been <strong style="color: ${status === 'accepted' ? '#28a745' : '#dc3545'};">${status.toUpperCase()}</strong>.
          </p>

          <table style="width: 100%; font-size: 14px; margin-top: 20px; margin-bottom: 20px;">
            <tr><td style="padding: 4px 0;"><strong>Email:</strong></td><td style="padding: 4px 0;">${request.email || '-'}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Discord:</strong></td><td style="padding: 4px 0;">${request.discordTag || '-'}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Company:</strong></td><td style="padding: 4px 0;">${request.selectedCompany || '-'}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Submission Type:</strong></td><td style="padding: 4px 0;">${request.routeSubmissionType || '-'}</td></tr>
          </table>

          <h3 style="margin-top: 30px; font-size: 16px;">Submitted Answers:</h3>
          <table style="width: 100%; font-size: 14px; border-spacing: 0; border-collapse: collapse;">
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

    // Send the email
    const mailOptions = {
      from: '"FlatStudios" <no-reply@flatstudios.net>',
      to: 'admin@flatstudios.net',
      bcc: request.email,
      subject: `Route Request ${status.toUpperCase()}: ${request.selectedCompany} - Route ${routeForDisplay.number}`,
      html,
    };

    await mailHub.sendMail(mailOptions);

    return res.status(200).json({ message: `Request ${status} successfully.` });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
}