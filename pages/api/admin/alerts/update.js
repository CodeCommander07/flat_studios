// /api/admin/alerts/update
import dbConnect from '@/utils/db';
import StaffNotices from '@/models/StaffNotices';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, title, content, type } = req.body;

  if (!id || !title || !content) {
    return res.status(400).json({ message: 'ID, title, and content are required.' });
  }

  const validTypes = ['announcement', 'update', 'alert'];
  const noticeType = validTypes.includes(type) ? type : 'announcement';

  try {
    await dbConnect();

    const updated = await StaffNotices.findByIdAndUpdate(
      id,
      { title, content, type: noticeType },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    res.status(200).json({ message: 'Announcement updated successfully.', updated });
  } catch (error) {
    console.error('Failed to update announcement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
