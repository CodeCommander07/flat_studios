import dbConnect from '@/utils/db';
import OperatorSubmission from '@/models/Operators';
import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false, // ✅ Required for formidable
  },
};

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(400).json({ error: 'Error parsing form data.' });

      try {
        let logoUrl = '';

        // ✅ Upload logo to CDN if provided
        if (files.logo) {
          const fileStream = fs.createReadStream(files.logo[0].filepath);

          const cdnRes = await fetch('https://yapton.vercel.app/api/cdn/upload', {
            method: 'POST',
            body: (() => {
              const formData = new FormData();
              formData.append('file', fileStream, files.logo[0].originalFilename);
              return formData;
            })(),
          });

          const cdnData = await cdnRes.json();

          if (cdnRes.ok && cdnData.fileId && cdnData.userId) {
            logoUrl = `https://yapton.vercel.app/api/cdn/view?fileId=${cdnData.fileId}&userId=${cdnData.userId}`;
          }
        }

        // ✅ Create new operator submission
        const submission = await OperatorSubmission.create({
          email: fields.email?.[0],
          robloxUsername: fields.robloxUsername?.[0],
          discordTag: fields.discordTag?.[0],
          operatorName: fields.operatorName?.[0],
          discordInvite: fields.discordInvite?.[0],
          robloxGroup: fields.robloxGroup?.[0],
          description: fields.description?.[0],
          logo: logoUrl,
        });

        return res.status(201).json({ success: true, submission });
      } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: err.message });
      }
    });
  }

  else if (req.method === 'GET') {
    const submissions = await OperatorSubmission.find();
    return res.status(200).json({ submissions });
  }

  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
