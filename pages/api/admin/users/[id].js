import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  switch (req.method) {
    case 'GET':
      try {
        // Exclude password field
        const user = await User.findById(id).select('-password');
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Server error' });
      }

    case 'PUT':
      try {
        // Only allow updating email, username, role
        const { email, username, role } = req.body;
        const updateData = { email, username, role };

        // Validate required fields here if you want (optional)

        const updatedUser = await User.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true, context: 'query' }
        ).select('-password');

        if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(updatedUser);
      } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Error updating user', error: error.message });
      }

    case 'DELETE':
      try {
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
          return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ message: 'User deleted successfully' });
      } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Error deleting user', error: error.message });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
