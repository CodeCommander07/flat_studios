import dbConnect from '@/utils/db';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Aggregate users who have logs + counts
    const usersWithCounts = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$userId',
          totalLogs: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          totalLogs: 1,
          username: '$user.username',
          email: '$user.email',
          role: '$user.role',
          profilePicture: '$user.discordAvatar' // or whatever field you use
        }
      }
    ]);

    res.status(200).json(usersWithCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users with activity logs' });
  }
}
