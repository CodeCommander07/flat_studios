import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();
  // Adjust this filter to your roles:
  const roles = ['Staff', 'Community-Director', 'Human-Resources', "Operations-Manager", "Developer", 'Web-Developer', 'Owner'];
  const staff = await User.find({ role: { $in: roles } })
    .select('_id name email avatar role')
    .sort({ name: 1 })
    .lean();
  res.status(200).json({ staff });
}
