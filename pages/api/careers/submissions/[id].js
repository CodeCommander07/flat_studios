import dbConnect from '@/utils/db';
import SubmittedApplication from '@/models/SubmittedApplication';

export default async function handler({ method, query, body }, res) {
  await dbConnect();
  const sub = await SubmittedApplication.findById(query.id).populate('applicationId');
  if (!sub) return res.status(404).end();

  if (method === 'GET') return res.json(sub);
  if (method === 'PUT') {
    sub.status = body.status;
    await sub.save();
    return res.json(sub);
  }
  if (method === 'DELETE') {
    await sub.remove();
    return res.json({ message: 'Deleted' });
  }
  res.setHeader('Allow', ['GET','PUT','DELETE']);
  res.status(405).end();
}
