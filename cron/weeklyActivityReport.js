import cron from 'node-cron';
import path from 'path';
import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import dbConnect from '@/utils/db';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import nodemailer from 'nodemailer';


const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  secure: true,
});

export default async function generateWeeklyReport() {
  await dbConnect();

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  // Get logs for last 7 days without populate
  const logs = await ActivityLog.find({ date: { $gte: weekAgoStr } });

  // Cache user info so we don't query the same user multiple times
  const userCache = new Map();

  // Function to get user info by userId string
  async function getUser(userId) {
    if (userCache.has(userId.toString())) return userCache.get(userId.toString());
    const user = await User.findById(userId).select('username email').lean();
    userCache.set(userId.toString(), user);
    return user;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Weekly Activity');

sheet.columns = [

  { header: 'User', key: 'username', width: 25 },
  { header: 'Total Activity In-Game', key: 'activity', width: 25 },
  { header: 'Total Shifts', key: 'shifts', width: 15 },
];

  // Add rows with user data fetched separately
  for (const log of logs) {
    const user = await getUser(log.userId);
    let totalLogs = 0
    let shiftLogs = 0

    if(log.notable ==="Yes"){shiftLogs++}
    totalLogs++

    sheet.addRow({
      username: user?.username || 'Unknown',
  activity: totalLogs,  // replace with actual field
  shifts: shiftLogs, 
    });
  }

  // Save to disk
  const reportsDir = path.resolve('./storage/reports');
  await fs.mkdir(reportsDir, { recursive: true });

  const filename = `weekly-activity-${now.toISOString().split('T')[0]}.xlsx`;
  const filePath = path.join(reportsDir, filename);

  await workbook.xlsx.writeFile(filePath);

  // Get email recipients with roles
  const recipients = await User.find({
    role: { $in: ['Community-Director', 'Human-Resources', 'Owner',] },
  }).select('email username').lean();

  const toEmails = recipients.map(u => u).filter(Boolean);

  if (toEmails.length > 0) {
    toEmails.forEach(async (e) => {
      
      const to = e.email
      
    await mailer.sendMail({
      from: 'Flat Studios <notifications@flatstudios.net>',
      to,
      subject: `${now.toISOString().split('T')[0]} Weeks Activity Report`,
      html: `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <tr>
        <td style="padding: 20px; background-color: #283335; color: #ffffff;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" style="vertical-align: middle; width: 50px;">
                <img src="https://flat-studios.vercel.app/cdn/image/logo.png" alt="Yapton & District Logo" style="max-width: 50px; height: auto; margin-right: 10px;">
              </td>
              <td align="center" style="vertical-align: middle;">
                <h1 style="font-size: 24px; margin: 0; color: #ffffff;">Weekly Activity Report</h1>
              </td>
              <td style="width: 50px;"></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <p style="font-size: 18px;">Hello <strong>${e.username || 'Community Director'}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">
            Please find attached the activity report for the week <strong>${weekAgo.toISOString().split('T')[0]} - ${now.toISOString().split('T')[0]}</strong>.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            This report summarizes all logged activities, including notable shifts and participation.
          </p>
          <p style="text-align: center; margin: 30px 0;">
  <a href="${process.env.BASE_URL || 'http://localhost:3000'}/fileview/excel?file=${encodeURIComponent(filename)}" 
     style="
       background-color: #4f46e5;
       color: white; 
       padding: 12px 24px; 
       text-decoration: none; 
       border-radius: 6px; 
       font-weight: bold;
       display: inline-block;
       margin-right: 10px;
     "
     target="_blank" rel="noopener noreferrer"
  >
    View
  </a>
  <a href="${process.env.BASE_URL || 'http://localhost:3000'}/files/reports/${filename}" 
     style="
       background-color: #10b981; /* a nice green for download */
       color: white; 
       padding: 12px 24px; 
       text-decoration: none; 
       border-radius: 6px; 
       font-weight: bold;
       display: inline-block;
     "
     download
  >
    Download
  </a>
</p>

          <p style="font-size: 16px; line-height: 1.6;">
            If you have any questions or require further details, please contact <a href="mailto:admin@flatstudios.net" style="color:#283335; text-decoration: underline;">admin@flatstudios.net</a>.
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 20px; background-color: #f4f4f9;">
          <p style="font-size: 14px;">Regards,<br><strong>Yapton & District Admin Team</strong></p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 10px; background-color: #f4f4f9;">
          <p style="font-size: 12px; color: #888;">This is an automated email. Yapton & District is a subsidiary of Flat Studios.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
      `,
    });
    });

  }
}


// Every Monday at 3:00 AM
cron.schedule('0 3 * * 1', generateWeeklyReport);
// For testing: run every minute
// cron.schedule('* * * * *', generateWeeklyReport);
