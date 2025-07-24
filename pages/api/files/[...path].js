import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  const {
    query: { path: filePathArray },
  } = req;

  if (!filePathArray || filePathArray.length === 0) {
    return res.status(400).send('File path required');
  }

  const filePath = path.join(process.cwd(), 'tmp', ...filePathArray);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  // Stream file
  const fileStream = fs.createReadStream(filePath);
  
  // Set headers based on file extension (optional but recommended)
  // You can use a mime-type library here for better content-type
  res.setHeader('Content-Disposition', `inline; filename="${filePathArray[filePathArray.length - 1]}"`);
  fileStream.pipe(res);
}
