import dbConnect from '@/utils/db';
import ApplicationForm from '@/models/ApplicationForm';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  // 🔹 Update form (used by EditForm)
  if (req.method === 'PUT') {
    try {
      const data = req.body;

      if (Array.isArray(data.questions)) {
        data.questions = data.questions.map((q) => ({
          ...q,
          autoDeny: q.autoDeny || false,
          acceptedAnswers:
            q.autoDeny && Array.isArray(q.acceptedAnswers)
              ? q.acceptedAnswers.filter((a) => a.trim() !== '')
              : [],
        }));
      }

      // --- 🧩 Normalize Requirements ---
      if (typeof data.requirements === 'string') {
        // Trim extra whitespace and normalize line breaks
        data.requirements = data.requirements
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .join('\n');
      }

      const updatedForm = await ApplicationForm.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      );

      if (!updatedForm)
        return res.status(404).json({ message: 'Form not found' });

      return res.json(updatedForm);
    } catch (err) {
      console.error('Error updating form:', err);
      return res.status(500).json({
        message: 'Error updating form',
        error: err.message,
      });
    }
  }

  // 🔹 Get form
  if (req.method === 'GET') {
    const form = await ApplicationForm.findById(id);
    if (!form) return res.status(404).end();
    return res.json(form);
  }

  // 🔹 Delete form
  if (req.method === 'DELETE') {
    await ApplicationForm.findByIdAndDelete(id);
    return res.json({ message: 'Deleted' });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end();
}
