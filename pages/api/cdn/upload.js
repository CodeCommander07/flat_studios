import { IncomingForm } from 'formidable';
import fs from 'fs';
import dbConnect from '@/utils/db';
import UserFile from '@/models/UserFile'; // Your Mongoose model for storing user files
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false, // must disable for formidable
  },
};

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm({
      keepExtensions: true,
      multiples: false,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

const flattenFields = (fields) =>
  Object.fromEntries(
    Object.entries(fields).map(([key, val]) => [key, Array.isArray(val) ? val[0] : val])
  );

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fields, files } = await parseForm(req);
    const flatFields = flattenFields(fields);

    await dbConnect();

    const userId = flatFields.userId;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    let userFileObj = null;
    if (files?.file) {
      userFileObj = Array.isArray(files.file) ? files.file[0] : files.file;
    } else {
      return res.status(400).json({ error: 'File is required' });
    }

    if (!userFileObj.filepath) {
      return res.status(400).json({ error: 'Invalid file upload' });
    }

    // Read the uploaded file into a buffer
    const fileBuffer = fs.readFileSync(userFileObj.filepath);
    const originalName = userFileObj.originalFilename || 'unnamed-file';

    // Construct file data for MongoDB
    const fileData = {
      userId,
      filename: `${Date.now()}-${uuidv4()}-${originalName}`,
      data: fileBuffer,
      contentType: userFileObj.mimetype || 'application/octet-stream',
      size: userFileObj.size,
      uploadedAt: new Date(),
    };

    // Save to DB
    const savedFile = await UserFile.create(fileData);

    // Cleanup temp file
    try {
      fs.unlinkSync(userFileObj.filepath);
    } catch (e) {
      console.warn('Failed to delete temp file:', e);
    }

    return res.status(201).json({ message: 'File uploaded successfully', fileId: savedFile._id });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
