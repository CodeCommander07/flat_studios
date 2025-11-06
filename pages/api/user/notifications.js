import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
  await dbConnect();

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    switch (req.method) {
      case 'GET': {
        const sorted = [...user.notifications].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        return res.status(200).json(sorted);
      }

      case 'POST': {
        const { notification, link } = req.body;
        if (!notification)
          return res.status(400).json({ error: 'Missing notification text' });

        const newNotif = {
          notification,
          link: link || null,
          read: false,
          createdAt: new Date(),
        };

        user.notifications.push(newNotif);
        await user.save();

        return res.status(201).json({ message: 'Notification added', newNotif });
      }

      case 'PATCH': {
        const { notifId } = req.body;
        if (!notifId) return res.status(400).json({ error: 'Missing notifId' });

        const notif = user.notifications.id(notifId);
        if (!notif) return res.status(404).json({ error: 'Notification not found' });

        notif.read = true;
        await user.save();

        return res.status(200).json({ message: 'Notification marked as read' });
      }

      case 'DELETE': {
        const { notifId } = req.body;
        if (!notifId) return res.status(400).json({ error: 'Missing notifId' });

        user.notifications = user.notifications.filter(n => n._id.toString() !== notifId);
        await user.save();

        return res.status(200).json({ message: 'Notification deleted' });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Notification API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
