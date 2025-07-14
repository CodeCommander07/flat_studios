import dbConnect from '@/utils/db'; 
import ApplicationForm from '@/models/ApplicationForm';

export default async function handler(req, res) {
  await dbConnect();
  if (req.method === 'GET') {
    const forms = await ApplicationForm.find();
    return res.json(forms);
  }
  if (req.method === 'POST') {
    const data = req.body;
    const form = new ApplicationForm(data);
    await form.save();
    return res.status(201).json(form);
  }
  res.setHeader('Allow', ['GET','POST']);
  res.status(405).end();
}
