import dbConnect from '@/utils/db';
import DeletedEmail from '@/models/DeletedEmail';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  const { messageId } = req.query;
  if (!messageId) return res.status(400).json({ error: 'Missing messageId' });

  await dbConnect();

  const doc = await DeletedEmail.findOne({ messageId });
  if (!doc) {
    return res.status(200).json({
      status: {
        deleted: false,
        flagged: false,
        flags: [],
        tags: [],
      },
    });
  }

  res.status(200).json({
    status: {
      deleted: doc.deleted || false,
      flagged: doc.flagged || false,
      flags: doc.flags || [],
      tags: doc.tags || [],
    },
  });
}
