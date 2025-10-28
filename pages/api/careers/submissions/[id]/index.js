// pages/api/careers/submissions/[id].js
import dbConnect from '@/utils/db';
import SubmittedApplication from '@/models/SubmittedApplication';

export default async function handler(req, res) {
  const { method, query, body } = req;
  await dbConnect();

  const { id } = query;
  const sub = await SubmittedApplication.findById(id)
  if (!sub) return res.status(404).json({ error: 'Submission not found' });

  switch (method) {
    case 'GET':
      return res.json(sub);

    case 'PUT':
      if (body.status) sub.status = body.status;
      if (body.denyReason) sub.denyReason = body.denyReason;
      await sub.save();
      return res.json(sub);

    case 'DELETE':
      await SubmittedApplication.findByIdAndDelete(id)
      return res.json({ message: 'Deleted' });

    default:
      res.setHeader('Allow', ['GET','PUT','DELETE']);
      return res.status(405).end();
  }
}
