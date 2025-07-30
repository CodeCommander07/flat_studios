import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();
  const { role } = req.query;

  let filter = {};
  if (role === 'DeveloperGroup') {
    filter = { role: { $in: ['Developer', 'Web-Developer'] } };
  } else if (role) {
    filter = { role };
  }

  const users = await User.find(filter, '_id name email role');
  res.status(200).json(users);
}
