import dbConnect from '@/utils/db';
import DeletedEmailModel from '@/models/DeletedEmail';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { subject } = req.body;
    if (!subject) return res.status(400).json({ error: 'Missing subject' });

    // Find all messages matching that subject and mark them deleted
    await DeletedEmailModel.updateMany(
      { normalizedSubject: subject.toLowerCase() },
      { $set: { deleted: true } },
      { upsert: true }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return res.status(500).json({ error: 'Failed to delete conversation' });
  }
}
