import dbConnect from '@/utils/db';
import ApplicationForm from '@/models/ApplicationForm';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const updatedForm = await ApplicationForm.findByIdAndUpdate(
        id,
        { ...req.body },
        { new: true, runValidators: true }
      );
      if (!updatedForm) return res.status(404).json({ message: 'Form not found' });
      return res.json(updatedForm);
    } catch (err) {
      return res.status(500).json({ message: 'Error updating form', error: err.message });
    }
  }

  if (req.method === 'GET') {
    const form = await ApplicationForm.findById(id);
    if (!form) return res.status(404).end();
    return res.json(form);
  }

  if (req.method === 'DELETE') {
    await ApplicationForm.findByIdAndDelete(id);
    return res.json({ message: 'Deleted' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end();
}
