import dbConnect from '@/utils/db';
import OperatorRequest from '@/models/OperatorRequest';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing request ID' });
  }

  try {
    await dbConnect();

    const request = await OperatorRequest.findById(id).select('mapFile');
    if (!request || !request.mapFile || !request.mapFile.data) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { data, contentType, filename } = request.mapFile;

    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    // Inline display to view in browser, fallback to attachment download
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${filename || 'file'}"`
    );

    // Send file buffer
    return res.status(200).send(data);
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
