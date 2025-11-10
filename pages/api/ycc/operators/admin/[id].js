import dbConnect from '@/utils/db';
import OperatorSubmission from '@/models/Operators';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // required for formidable
  },
};

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  switch (req.method) {
    // 🔹 GET
    case 'GET': {
      const submission = await OperatorSubmission.findById(id);
      if (!submission) return res.status(404).json({ error: 'Not found' });

      const formatted = submission.toObject();
      if (formatted.logo?.data) {
        formatted.logo = `data:${formatted.logo.contentType};base64,${formatted.logo.data.toString(
          'base64'
        )}`;
      } else {
        formatted.logo = null;
      }

      return res.status(200).json({ success: true, submission: formatted });
    }

    // 🔹 PUT (update)
    case 'PUT': {
      try {
        const form = formidable({});
        form.parse(req, async (err, fields, files) => {
          if (err) return res.status(400).json({ error: 'Invalid form data' });

          // 🧹 Normalize all field values to plain strings
          const updateData = {};
          for (const [key, value] of Object.entries(fields)) {
            updateData[key] = Array.isArray(value) ? value[0] : value;
          }

          // 🖼️ If a logo file is included
          if (files.logo && files.logo[0]) {
            const file = files.logo[0];
            const data = fs.readFileSync(file.filepath);
            updateData.logo = {
              data,
              contentType: file.mimetype,
            };
          }

          const updated = await OperatorSubmission.findByIdAndUpdate(id, updateData, {
            new: true,
          });

          if (!updated) return res.status(404).json({ error: 'Not found' });
          return res.status(200).json({ success: true, updated });
        });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
      break;
    }

    // 🔹 DELETE
    case 'DELETE': {
      try {
        await OperatorSubmission.findByIdAndDelete(id);
        return res.status(200).json({ success: true });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
