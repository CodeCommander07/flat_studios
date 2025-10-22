import dbConnect from '@/utils/db';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import { google } from 'googleapis';

function parseDuration(duration) {
  if (!duration) return 0;
  const [h, m, s] = duration.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m
    .toString()
    .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Only GET requests allowed' });

  await dbConnect();

  const now = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(now.getDate() - 7);

  const allowedRoles = ['	Web-Developer']; // customize

  const users = await User.find({ role: { $in: allowedRoles } });
  if (!users.length)
    return res.status(200).json({ message: 'No eligible users found.' });

  const logs = await ActivityLog.find({
    createdAt: { $gte: lastWeek, $lte: now },
  }).populate('userId', 'email role');

  const summaries = [];

  for (const user of users) {
    const userLogs = logs.filter((l) => l.userId?._id?.equals(user._id));
    const totalShifts = userLogs.length;
    const totalSeconds = userLogs.reduce(
      (acc, l) => acc + parseDuration(l.duration),
      0
    );
    if (totalShifts > 0) {
      summaries.push({
        email: user.email,
        totalShifts,
        totalTime: formatDuration(totalSeconds),
      });
    }
  }

  if (!summaries.length)
    return res.status(200).json({ message: 'No data for this week.' });

  // 🔐 Authenticate with Google
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  // 📝 Create a new Google Sheet
  const sheetTitle = `Weekly Summary ${now.toISOString().split('T')[0]}`;
  const createRes = await sheets.spreadsheets.create({
    resource: {
      properties: { title: sheetTitle },
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId;

  // 🧮 Prepare data rows
  const values = [
    ['Email', 'Total Shifts', 'Total Time (HH:MM:SS)'],
    ...summaries.map((entry) => [
      entry.email,
      entry.totalShifts,
      entry.totalTime,
    ]),
  ];

  // ✏️ Write data to the sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'A1',
    valueInputOption: 'RAW',
    resource: { values },
  });

  // 🔗 Share the sheet with all user emails
  for (const user of users) {
    try {
      await drive.permissions.create({
        fileId: spreadsheetId,
        resource: {
          type: 'user',
          role: 'reader',
          emailAddress: user.email,
        },
        fields: 'id',
      });
    } catch (err) {
      console.error(`Failed to share with ${user.email}:`, err.message);
    }
  }

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  console.log(`✅ Weekly summary created: ${sheetUrl}`);

  res.status(200).json({
    success: true,
    sheetUrl,
    count: summaries.length,
  });
}
