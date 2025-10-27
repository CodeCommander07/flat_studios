// pages/api/ycc/operator-application.js
import dbConnect from '@/utils/db';
import OperatorApplication from '@/models/OperatorSubmission';
import nodemailer from 'nodemailer';

export const config = { api: { bodyParser: true } };

const mailHub = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  secure: true,
});

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    await dbConnect();
    const {
      email,
      robloxUsername,
      discordUsername,
      discordId,
      robloxId,
      operatorName,
      operatorFleet,
      operatorDiscord,
      operatorRoblox,
      reason,
    } = req.body || {};

    // minimal server-side validation
    const required = {
      email, robloxUsername, discordUsername, discordId, robloxId,
      operatorName, operatorFleet, operatorDiscord, operatorRoblox, reason
    };
    for (const [k, v] of Object.entries(required)) {
      if (!v || String(v).trim() === '') {
        return res.status(400).json({ success: false, error: `Missing field: ${k}` });
      }
    }

    const saved = await OperatorApplication.create({
      email,
      robloxUsername,
      discordUsername,
      discordId,
      robloxId,
      operatorName,
      operatorFleet,
      operatorDiscord,
      operatorRoblox,
      reason,
    });

    // Email (admin + applicant)
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f6f7fb;padding:0;margin:0;">
      <table align="center" cellpadding="0" cellspacing="0" width="600" style="margin:20px auto;background:#fff;border-radius:8px;overflow:hidden">
        <tr><td style="background:#283335;color:#fff;padding:16px 20px"><h2 style="margin:0;font-size:18px">New Operator Application</h2></td></tr>
        <tr><td style="padding:20px">
          <h3 style="margin:0 0 10px 0">${operatorName}</h3>
          <table width="100%" style="font-size:14px;border-collapse:collapse">
            <tr><td><strong>Email</strong></td><td>${email}</td></tr>
            <tr><td><strong>Discord Username</strong></td><td>${discordUsername}</td></tr>
            <tr><td><strong>Discord ID</strong></td><td>${discordId}</td></tr>
            <tr><td><strong>Roblox Username</strong></td><td>${robloxUsername}</td></tr>
            <tr><td><strong>Roblox ID</strong></td><td>${robloxId}</td></tr>
            <tr><td><strong>Operator Discord</strong></td><td>${operatorDiscord}</td></tr>
            <tr><td><strong>Operator Roblox</strong></td><td>${operatorRoblox}</td></tr>
            <tr><td valign="top"><strong>Operator Fleet</strong></td><td>${operatorFleet?.replace(/\n/g,'<br/>') || '-'}</td></tr>
            <tr><td valign="top"><strong>Reason</strong></td><td>${reason?.replace(/\n/g,'<br/>') || '-'}</td></tr>
          </table>
          <p style="margin-top:16px;color:#666">Submitted at ${new Date(saved.createdAt).toLocaleString('en-GB')}</p>
        </td></tr>
      </table>
    </body></html>`;

    await mailHub.sendMail({
      from: '"FlatStudios" <no-reply@flatstudios.net>',
      to: 'admin@flatstudios.net',
      bcc: email,
      subject: `Operator Application — ${operatorName}`,
      html,
    });

    return res.status(201).json({ success: true, id: saved._id });
  } catch (err) {
    console.error('operator-application submit error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
}
