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

    if (req.method === 'DELETE') {
        const { id } = req.query;
        try {
            await ActivityLog.findByIdAndDelete(id);
            return res.status(200).json({ message: 'Deleted' });
        } catch (e) {
            return res.status(500).json({ message: 'Failed to delete' });
        }
    }
    if (req.method === 'PUT') {
        const { id } = req.query;
        const { date, duration, description } = req.body;

        if (!date || !duration || !description) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        try {
            const updated = await ActivityLog.findByIdAndUpdate(
                id,
                { date: new Date(date), duration, description },
                { new: true }
            );
            if (!updated) {
                return res.status(404).json({ message: 'Not found' });
            }
            return res.status(200).json(updated);
        } catch (e) {
            return res.status(500).json({ message: 'Failed to update' });
        }
    }
}