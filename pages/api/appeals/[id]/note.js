// Example: /api/appeals/[id]/note.js
import dbConnect from '@/utils/db';
import Appeal from '@/models/Appeals';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'POST') {
    const { staffMember, noteText } = req.body;
    const appeal = await Appeal.findById(id);
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

    const newNote = {
      staffMember, // just the ID
      noteText,
      createdAt: new Date(),
    };

    appeal.notes.push(newNote);
    await appeal.save();
    res.status(200).json(appeal);
  }
}
