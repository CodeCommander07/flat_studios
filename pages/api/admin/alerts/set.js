import dbConnect from '@/utils/db';
import StaffNotices from '@/models/StaffNotices';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, type, content } = req.body;
  console.log('Received data:', { title, type, content });

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  // Validate type to be one of the enum options
  const validTypes = ['announcement', 'update', 'alert'];
  const noticeType = validTypes.includes(type) ? type : 'announcement';

  try {
    await dbConnect();

    const newNotice = new StaffNotices({
      title,
      type: noticeType,
      content,
    });

    await newNotice.save();

    res.status(201).json({ message: 'Announcement saved successfully.' });
  } catch (error) {
    console.error('Failed to save announcement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
