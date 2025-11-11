import dbConnect from '@/utils/db';
import Newsletter from '@/models/Newsletter';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  const newsletter = await Newsletter.findById(id);
  if (!newsletter)
    return res.status(404).send('<h2>Newsletter not found</h2>');

  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${newsletter.title || 'Newsletter Preview'}</title>
      <style>
        body {
          background: #283335;
          color: white;
          font-family: sans-serif;
          display: flex;
          justify-content: center;
          align-items: start;
          padding: 40px;
        }
        .container {
          background: white;
          color: black;
          max-width: 700px;
          width: 100%;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${newsletter.html || '<p>No content.</p>'}
      </div>
    </body>
    </html>
  `);
}
