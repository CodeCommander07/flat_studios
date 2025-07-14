import dbConnect from '@/utils/db'; 
import ApplicationForm from '@/models/ApplicationForm';

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== 'GET') return res.status(405).end();

  const openRoles = await ApplicationForm.find({ open:true });
  res.status(200).json(openRoles);
}
