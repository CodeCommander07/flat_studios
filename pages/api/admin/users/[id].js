import dbConnect from '@/utils/db';
import User from '@/models/User';
import { generateRandomPassword, hashPassword } from '@/utils/auth';
import { sendMail } from '@/utils/mailHub'; 
import { notifyUser } from '@/utils/notifyUser';

export default async function handler(req, res) {
  await dbConnect();
  const { id, action } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const user = await User.findById(id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.status(200).json(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Server error' });
      }

    case 'PUT':
      try {
        const { email, username, role } = req.body;
        const updateData = { email, username, role };
        const updatedUser = await User.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
          context: 'query',
        }).select('-password');

        let notMsg
        if(email){
        notMsg = `Hello, ${username} your email has been updated to ${email}. This update was done by an Admin Member.`
        }
        if(username){
        notMsg = `Hello, ${username} your username has been updated. This update was done by an Admin Member.`
        }
        if(role){
        notMsg = `Hello, ${username} your role has been updated to ${role}. This update was done by an Admin Member.`
        }

        notifyUser(updatedUser, notMsg, '/me/')

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

    case 'POST':
      if (action === 'resetPas') {
        try {
          const newPassword = generateRandomPassword(12);
          const hashed = await hashPassword(newPassword);

          const updated = await User.findByIdAndUpdate(id, {
            password: hashed,
          });

          if (!updated) {
            return res.status(404).json({ message: 'User not found' });
          }

          // Send email notification
          const user = await User.findById(id).select('email username');
          if (user && user.email) {
            const mailContent = `
              <h1>Password Reset Notification</h1>
              <p>Dear ${user.username},</p>
              <p>Your password has been reset successfully. Your new password is: <strong>${newPassword}</strong></p>
              <p>Please log in and change your password immediately.</p>
              <p>Thank you!</p>
            `;
            await sendMail(user.email, 'Password Reset Confirmation', mailContent);
          }

          return res.status(200).json({
            message: 'Password reset successfully',
            password: newPassword,
          });
        } catch (error) {
          console.error('Error resetting password:', error);
          return res.status(500).json({ message: 'Failed to reset password', error: error.message });
        }
      } else {
        return res.status(400).json({ message: 'Invalid action' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'POST']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
