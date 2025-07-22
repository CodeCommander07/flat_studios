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
    const usersWithActivity = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$userId',
          totalActivity: { $sum: 1 },
          totalShifts: {
            $sum: {
              $cond: [
                { $eq: ['$host', 'Yes'] },
                1,
                0
              ]
            }
          }
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
          totalActivity: 1,
          totalShifts: 1,
          username: '$user.username',
          email: '$user.email',
          role: '$user.role',
          profilePicture: '$user.defaultAvatar'
        }
      }
    ]);

    res.status(200).json(usersWithActivity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch activity log data' });
  }
}
