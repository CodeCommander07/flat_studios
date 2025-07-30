// /api/admin/alerts/delete
import dbConnect from '@/utils/db';
import StaffNotices from '@/models/StaffNotices';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'ID is required.' });
  }

  try {
    await dbConnect();

    const deleted = await StaffNotices.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    res.status(200).json({ message: 'Announcement deleted successfully.' });
  } catch (error) {
    console.error('Failed to delete announcement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
