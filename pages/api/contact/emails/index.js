import Imap from 'imap';
import { simpleParser } from 'mailparser';

function normalizeSubject(subject) {
  if (!subject) return '';
  return subject.replace(/^(Re:\s*)+/i, '').trim();
}

function extractSenderName(fromField = '') {
  const nameMatch = fromField.match(/^(.*?)\s*<.*?>$/);
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1].replace(/"/g, '').trim();
  }
  return fromField.replace(/<.*?>/g, '').trim();
}

function removeSignature(text) {
  if (!text) return '';
  const signatureRegex =
    /(CONFIDENTIALITY NOTICE|LEGAL DISCLAIMER|VIRUS CHECK|NO LIABILITY|COMPLIANCE WITH APPLICABLE LAWS|Flat Studios; Home to)[\s\S]*$/i;
  return text.replace(signatureRegex, '').trim();
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

    const emails = [];
    const parsePromises = [];

    const openAndFetch = (boxName) =>
      new Promise((res, rej) => {
        imap.openBox(boxName, true, (err, box) => {
          if (err) return rej(err);
          if (!box.messages.total) return res();

          const fetchRange =
            box.messages.total > 20 ? `${box.messages.total - 19}:*` : '1:*';
          const fetch = imap.seq.fetch(fetchRange, { bodies: '', struct: true });

          fetch.on('message', (msg) => {
            let buffer = '';
            let attrs = null;

            msg.on('body', (stream) =>
              stream.on('data', (chunk) => (buffer += chunk.toString('utf8')))
            );

            msg.once('attributes', (a) => {
              attrs = a;
            });

            msg.once('end', () => {
              const threadId = attrs?.['x-gm-thrid'];
              const flags = attrs?.flags?.map((f) => f.toLowerCase()) || [];
              const labels = (attrs?.['x-gm-labels'] || []).map((l) =>
                l.toLowerCase()
              );

              if (
                flags.includes('\\trash') ||
                labels.includes('trash') ||
                labels.includes('bin')
              )
                return;

              const parsePromise = simpleParser(buffer)
                .then((parsed) => {
                  const toAddresses = parsed.to?.text?.toLowerCase() || '';
                  const fromAddress = parsed.from?.text?.toLowerCase() || '';

                  let staffName
                  let staffRole
                  
                  const isToHelp =
                    toAddresses.includes('help@flatstudios.net') ||
                    toAddresses.includes('help@');
                  const isFromHelp =
                    fromAddress.includes('help@flatstudios.net') ||
                    fromAddress.includes('help@');

                  if (isFromHelp) {
                    const nameMatch = parsed.html?.match(/<strong>(.*?)<\/strong>/i);
                    const roleMatch = parsed.html?.match(/color:#666;">(.*?)<\/p>/i);
                    if (nameMatch) staffName = nameMatch[1].trim();
                    if (roleMatch) staffRole = roleMatch[1].trim();
                  }

                  if (!isToHelp && !isFromHelp) return;

                  const direction = isFromHelp ? 'sent' : 'received';
                  const fromFull = parsed.from?.text || '';
                  const senderName = extractSenderName(fromFull);

                  const cleanText = removeSignature(
                    (parsed.text || '')
                      .split(
                        /[-]{3,}\s*Please reply above this line\s*[-]{3,}/i
                      )[0]
                      .replace(/On\s.*wrote:/gis, '')
                      .replace(/^>.*$/gm, '')
                      .trim()
                  );

                  const cleanHtml = removeSignature(
                    (parsed.html || '')
                      .split(
                        /[-]{3,}\s*Please reply above this line\s*[-]{3,}/i
                      )[0]
                      .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '')
                      .trim()
                  );

                  emails.push({
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    senderName,
                    subject: parsed.subject || '',
                    date: parsed.date || new Date(),
                    text: cleanText,
                    html: cleanHtml,
                    messageId: parsed.messageId,
                    direction,
                    threadId,
                    box: boxName,
                    staffName,
                    staffRole
                  });
                })
                .catch(console.error);

              parsePromises.push(parsePromise);
            });
          });

          fetch.once('error', rej);
          fetch.once('end', res);
        });
      });

    imap.once('ready', async () => {
      try {
        await openAndFetch('INBOX');
        await openAndFetch('[Gmail]/Sent Mail');
        await Promise.all(parsePromises);
        imap.end();

        const grouped = emails.reduce((acc, email) => {
          const key = normalizeSubject(email.subject);
          if (!acc[key]) acc[key] = [];
          acc[key].push(email);
          return acc;
        }, {});

        // Sort by date
        for (const key in grouped) {
          grouped[key].sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        resolve(grouped);
      } catch (err) {
        imap.end();
        reject(err);
      }
    });

    imap.once('error', reject);
    imap.connect();
  });
}

export default async function handler(req, res) {
  try {
    const groupedEmails = await fetchRecentEmails();
    res.status(200).json({ conversations: groupedEmails });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
}
