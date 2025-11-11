import Imap from 'imap';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { threadId } = req.body;
  if (!threadId)
    return res.status(400).json({ error: 'Missing threadId (X-GM-THRID)' });

  const imap = new Imap({
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  function findTrashFolder(callback) {
    imap.getBoxes((err, boxes) => {
      if (err) return callback(err);

      const searchFolders = (tree, prefix = '') => {
        for (const [name, box] of Object.entries(tree)) {
          const fullName = prefix ? `${prefix}${box.delimiter}${name}` : name;
          const lower = fullName.toLowerCase();
          if (lower.includes('trash') || lower.includes('bin')) return fullName;
          if (box.children) {
            const child = searchFolders(box.children, fullName);
            if (child) return child;
          }
        }
        return null;
      };

      const trash = searchFolders(boxes);
      if (!trash) return callback(new Error('No Trash folder found'));
      callback(null, trash);
    });
  }

  function searchAndMoveByThread(trashFolder, done) {
    imap.openBox('[Gmail]/All Mail', false, (err, box) => {
      if (err) return done(err);

      // Gmail-specific search for thread ID
      imap.search([['X-GM-THRID', threadId]], (err, results) => {
        if (err || !results?.length)
          return imap.closeBox(false, () => done(null, 0));

        console.log(`🧵 Found ${results.length} messages in thread ${threadId}`);
        imap.move(results, trashFolder, (err) => {
          imap.closeBox(false, () => done(err, results.length));
        });
      });
    });
  }

  imap.once('ready', () => {
    findTrashFolder((err, trashFolder) => {
      if (err) {
        console.error('Trash folder lookup failed:', err);
        imap.end();
        return res.status(500).json({ error: 'Could not locate Gmail Trash folder' });
      }

      searchAndMoveByThread(trashFolder, (err, movedCount) => {
        imap.end();
        if (err) {
          console.error('Move error:', err);
          return res.status(500).json({ error: 'Failed to move messages' });
        }

        res.status(200).json({
          success: true,
          movedToTrash: movedCount || 0,
          trashFolder,
          threadId,
        });
      });
    });
  });

  imap.once('error', (err) => {
    console.error('IMAP error:', err);
    if (!res.headersSent)
      res.status(500).json({ error: 'IMAP connection failed' });
  });

  imap.connect();
}
