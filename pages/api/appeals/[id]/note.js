// POST /api/appeals/:id/note
import dbConnect from '@/utils/db';
import Appeal from '@/models/Appeals';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'POST') {
    const { staffMember, noteText } = req.body;
    if (!staffMember || !noteText) {
      return res.status(400).json({ error: 'staffMember and noteText are required' });
    }

    try {
      const appeal = await Appeal.findById(id);
      if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

      appeal.notes.push({ staffMember, noteText });
      await appeal.save();

      res.status(200).json(appeal);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add note' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
