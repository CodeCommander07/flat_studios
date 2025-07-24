export default async function handler(req, res) {
  const { key } = req.query;

  global.tempFileCache = global.tempFileCache || new Map();

  const entry = global.tempFileCache.get(key);

  if (!entry || Date.now() > entry.expiresAt) {
    return res.status(404).send('File not found or expired.');
  }

  res.setHeader('Content-Type', entry.contentType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${entry.filename || 'file'}"`);
  return res.status(200).send(entry.data);
}
