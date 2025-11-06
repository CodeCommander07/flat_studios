import User from '@/models/User';
import dbConnect from '@/utils/db';

export async function notifyUser(userId, notification, link = null) {
  await dbConnect();
  const user = await User.findOne({ _id:userId });
  if (!user) throw new Error('User not found');

  user.notifications.push({ notification, link });
  await user.save();

  return true;
}
