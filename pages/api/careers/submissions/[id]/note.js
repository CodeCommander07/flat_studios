// pages/api/careers/submissions/[id]/note.js
import dbConnect from '@/utils/db';
import SubmittedApplication from '@/models/SubmittedApplication';

export default async function handler(req, res) {
  const { method, query, body } = req;
  await dbConnect();

  const { id } = query;
  const sub = await SubmittedApplication.findById(id);
  if (!sub) return res.status(404).json({ error: 'Submission not found' });

  if (method === 'POST') {
    const { staffMember, noteText, system } = body;

    if (!noteText || !staffMember) {
      return res.status(400).json({ error: 'Missing noteText or staffMember' });
    }

    const note = {
      staffMember,
      noteText,
      createdAt: new Date(),
      system: system || false,
    };

    sub.notes = sub.notes || [];
    sub.notes.push(note);
    await sub.save();

    return res.status(201).json(note);
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end();
}
