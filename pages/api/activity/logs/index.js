// /pages/api/activity/logs.js OR /app/api/activity/logs/route.js depending on your Next.js version

import dbConnect from '@/utils/db';
import ActivityLog from '@/models/ActivityLog';

// Helper to get user ID from request.
// Replace this with your real auth logic (JWT/session).
function getUserIdFromReq(req) {
  // For demo, read from a custom header 'x-user-id' (send from frontend)
  return req.headers['x-user-id'] || null;
}

export default async function handler(req, res) {
  await dbConnect();

  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: missing user ID' });
  }

  if (req.method === 'GET') {
    // Return all activity logs for this user, sorted by date desc
    try {
      const logs = await ActivityLog.find({ userId }).sort({ date: -1 });
      return res.status(200).json(logs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return res.status(500).json({ message: 'Error fetching logs' });
    }
  }

  if (req.method === 'POST') {
    // Create new activity log for this user
    const { date, duration, description } = req.body;

    if (!date || !duration || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
      const newLog = new ActivityLog({
        userId,
        date: new Date(date),
        duration: parseFloat(duration),
        description,
      });

      await newLog.save();

      return res.status(201).json({ message: 'Activity log created', log: newLog });
    } catch (error) {
      console.error('Error creating activity log:', error);
      return res.status(500).json({ message: 'Error creating log' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
