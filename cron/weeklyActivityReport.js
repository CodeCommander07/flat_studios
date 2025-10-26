import cron from 'node-cron';
import path from 'path';
import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import dbConnect from '@/utils/db';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import nodemailer from 'nodemailer';
import { DateTime } from 'luxon';

const TIMEZONE = 'Europe/London';

// ✅ Setup Gmail transporter
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  secure: true,
});

// ✅ Robust duration parser
function parseDurationToMinutes(str) {
  if (!str || typeof str !== 'string') return 0;

  const hhmm = str.match(/^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/);
  if (hhmm) {
    const h = parseInt(hhmm[1] || '0', 10);
    const m = parseInt(hhmm[2] || '0', 10);
    return h * 60 + m;
  }

  const hm = str.match(/(?:(\d+)\s*h(?:ours?)?)?\s*(?:(\d+)\s*m(?:in(?:ute)?s?)?)?/i);
  if (hm && (hm[1] || hm[2])) {
    const h = parseInt(hm[1] || '0', 10);
    const m = parseInt(hm[2] || '0', 10);
    return h * 60 + m;
  }

  const plain = parseInt(str, 10);
  return !isNaN(plain) ? plain : 0;
}

// ✅ Get last week (Sunday 00:00 → Sunday 00:00)
function getLastWeekRange() {
  const now = DateTime.now().setZone(TIMEZONE);
  const thisSunday = now.startOf('week').minus({ days: 1 }).startOf('day');
  const lastSunday = thisSunday.minus({ weeks: 1 });
  return {
    from: lastSunday.toJSDate(),
    to: thisSunday.toJSDate(),
    labelFrom: lastSunday.toFormat('dd LLL yyyy'),
    labelTo: thisSunday.toFormat('dd LLL yyyy'),
    labelDate: thisSunday.toFormat('yyyy-LL-dd'),
  };
}

export default async function generateWeeklyReport() {
  console.log('🕒 Starting weekly report generation...');
  await dbConnect();

  const { from, to, labelFrom, labelTo, labelDate } = getLastWeekRange();

  console.log(`📅 Collecting logs from ${labelFrom} → ${labelTo}`);

  // ✅ Use createdAt (timestamps) for filtering
  const logs = await ActivityLog.find({
    createdAt: { $gte: from, $lt: to },
  }).populate('userId', 'username email');

  if (!logs.length) {
    console.log('⚠️ No logs found for this period.');
  } else {
    console.log(`✅ Found ${logs.length} logs`);
  }

  // Group logs per user
  const activityMap = new Map();
  for (const log of logs) {
    const userId = log.userId?._id?.toString();
    if (!userId) continue;
    if (!activityMap.has(userId)) activityMap.set(userId, { totalMinutes: 0, totalShifts: 0, user: log.userId });

    const mins = parseDurationToMinutes(log.duration);
    const agg = activityMap.get(userId);
    agg.totalMinutes += mins;
    agg.totalShifts += 1;
  }

  // ✅ Prepare Excel
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Weekly Activity');
  sheet.columns = [
    { header: 'User', key: 'username', width: 25 },
    { header: 'Total Shifts', key: 'totalShifts', width: 15 },
    { header: 'Weekly Total Time', key: 'weeklyTime', width: 20 },
    { header: 'Email', key: 'email', width: 35 },
  ];
  sheet.getRow(1).font = { bold: true };

  let totalMins = 0;
  let totalShifts = 0;

  for (const [userId, data] of activityMap.entries()) {
    const hours = Math.floor(data.totalMinutes / 60);
    const minutes = data.totalMinutes % 60;
    const user = data.user;

    sheet.addRow({
      username: user.username || 'Unknown',
      totalShifts: data.totalShifts,
      weeklyTime: `${hours}h ${minutes}m`,
      email: user.email,
    });

    // update user stats
    await User.findByIdAndUpdate(userId, {
      $set: {
        weeklyHours: hours,
        weeklyMinutes: minutes,
        weeklyShifts: data.totalShifts,
      },
    });

    totalMins += data.totalMinutes;
    totalShifts += data.totalShifts;
  }

  // Add total row
  const totalHours = Math.floor(totalMins / 60);
  const totalMinutes = totalMins % 60;
  sheet.addRow({
    username: 'TOTAL',
    totalShifts: totalShifts,
    weeklyTime: `${totalHours}h ${totalMinutes}m`,
    email: '',
  });
  sheet.lastRow.font = { bold: true };

  // Save file
  const reportsDir = path.resolve('./storage/reports');
  await fs.mkdir(reportsDir, { recursive: true });
  const filename = `weekly-activity-${labelDate}.xlsx`;
  const filePath = path.join(reportsDir, filename);
  await workbook.xlsx.writeFile(filePath);

  console.log(`💾 Report saved: ${filePath}`);

  // ✅ Send email
  const recipients = await User.find({
    role: { $in: ['Web-Developer'] },
  }).select('email username').lean();

  if (!recipients.length) {
    console.log('⚠️ No recipients found.');
    return;
  }

  console.log(`📧 Sending emails to ${recipients.length} recipients...`);

  for (const e of recipients) {
    try {
      await mailer.sendMail({
        from: 'Flat Studios <notifications@flatstudios.net>',
        to: e.email,
        subject: `Weekly Activity Report – ${labelFrom} → ${labelTo}`,
        html: `
          <p>Hello <b>${e.username || ''}</b>,</p>
          <p>The weekly activity report for <b>${labelFrom}</b> – <b>${labelTo}</b> is now available.</p>
          <p>
            <a href="${process.env.BASE_URL || 'http://localhost:3000'}/files/reports/${filename}"
              style="background-color:#10b981;color:white;padding:10px 20px;border-radius:5px;text-decoration:none">
              Download Report
            </a>
          </p>
          <p>— Flat Studios Automated Reports</p>
        `,
      });
      console.log(`✅ Sent to ${e.email}`);
    } catch (err) {
      console.error(`❌ Failed to send to ${e.email}:`, err.message);
    }
  }

  console.log('🎉 Weekly report process completed successfully.');
}

// 🕒 Runs every Sunday 00:00 (Europe/London)
cron.schedule('* * * * *', generateWeeklyReport, {
  timezone: TIMEZONE,
});
