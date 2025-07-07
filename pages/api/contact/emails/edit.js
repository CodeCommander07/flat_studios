import dbConnect from '@/utils/db';
import DeletedEmail from '@/models/DeletedEmail';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { messageId, deleted, flagged, flags = [], tags = [] } = req.body;
  if (!messageId) return res.status(400).json({ error: 'Missing messageId' });

  await dbConnect();

  const existing = await DeletedEmail.findOne({ messageId });

  if (!existing) {
    // Create new entry
    await DeletedEmail.create({
      messageId,
      deleted,
      flagged,
      flags,
      tags,
    });
  } else {
    // Update existing
    existing.deleted = deleted;
    existing.flagged = flagged;
    existing.flags = flags;
    existing.tags = tags;
    await existing.save();
  }

  res.status(200).json({ success: true });
}
