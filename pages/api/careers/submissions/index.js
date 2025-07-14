import dbConnect from '@/utils/db';
import SubmittedApplication from '@/models/SubmittedApplication';

export default async function handler(req, res) {
  await dbConnect();
  if (req.method === 'GET') {
    const subs = await SubmittedApplication.find().populate('applicationId');
    return res.json(subs);
  }
  if (req.method === 'POST') {
    const sub = new SubmittedApplication(req.body);
    await sub.save();
    return res.status(201).json(sub);
  }
  res.setHeader('Allow', ['GET','POST']);
  res.status(405).end();
}
