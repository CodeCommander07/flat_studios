import Imap from 'imap';
import { simpleParser } from 'mailparser';

import DeletedEmailModel from '@/models/DeletedEmail';
import dbConnect from '@/utils/db';

function normalizeSubject(subject) {
  if (!subject) return '';
  return subject.replace(/^(Re:\s*)+/i, '').trim();
}

function fetchRecentEmails() {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: process.env.MAIL_USER,
      password: process.env.MAIL_PASS,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    function openInbox(cb) {
      imap.openBox('INBOX', true, cb);
    }

    const emails = [];
    const parsePromises = [];

    imap.once('ready', () => {
      openInbox((err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        const fetchRange = box.messages.total > 20 ? `${box.messages.total - 19}:*` : '1:*';
        const fetch = imap.seq.fetch(fetchRange, { bodies: '', struct: true });

        fetch.on('message', (msg) => {
          let buffer = '';

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });

            stream.once('end', () => {
              const parsePromise = simpleParser(buffer)
                .then(parsed => {
                  emails.push({
                    from: parsed.from?.text || '',
                    subject: parsed.subject || '',
                    date: parsed.date || new Date(),
                    text: parsed.text || '',
                    html: parsed.html || '',
                    messageId: parsed.messageId || '', // For replying
                  });
                })
                .catch(err => {
                  console.error('Email parse error:', err);
                });
              parsePromises.push(parsePromise);
            });
          });
        });

        fetch.once('error', (fetchErr) => {
          imap.end();
          reject(fetchErr);
        });

        fetch.once('end', async () => {
          try {
            await Promise.all(parsePromises);
            imap.end();

            // Group emails by normalized subject
            const grouped = emails.reduce((acc, email) => {
              const key = normalizeSubject(email.subject);
              if (!acc[key]) acc[key] = [];
              acc[key].push(email);
              return acc;
            }, {});

            // Sort each group by date ascending
            for (const key in grouped) {
              grouped[key].sort((a, b) => new Date(a.date) - new Date(b.date));
            }

            resolve(grouped);
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    imap.once('error', (err) => reject(err));
    imap.connect();
  });
}

export default async function handler(req, res) {
  await dbConnect();

  try {
    // Fetch all email statuses from DB
    const statuses = await DeletedEmailModel.find({});
    const statusMap = new Map();
    for (const status of statuses) {
      statusMap.set(status.messageId, {
        deleted: status.deleted || false,
        flagged: status.flagged || false,
        flags: status.flags || [],
        tags: status.tags || [],
      });
    }

    // Fetch recent emails from IMAP
    const groupedEmails = await fetchRecentEmails();

    // Merge statuses + filter out deleted
    for (const subject in groupedEmails) {
      groupedEmails[subject] = groupedEmails[subject]
        .map(email => {
          const status = statusMap.get(email.messageId) || {};
          return { ...email, ...status };
        })
        .filter(email => !email.deleted); // Exclude deleted ones

      // Remove empty groups
      if (groupedEmails[subject].length === 0) {
        delete groupedEmails[subject];
      }
    }

    res.status(200).json({ conversations: groupedEmails });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
}
