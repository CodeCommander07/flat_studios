'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const extractEmail = (address) => {
  const match = address.match(/<(.+)>/);
  return match ? match[1] : address;
};

function normalizeSubject(subject) {
  if (!subject) return '';
  return subject.replace(/^(Re:\s*)+/i, '').trim();
}

export default function ContactEmailsPage() {
  const [conversations, setConversations] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchEmails() {
      try {
        const res = await axios.get('/api/contact/emails');
        setConversations(res.data.conversations);
        const subjects = Object.keys(res.data.conversations);
        if (subjects.length) {
          setSelectedSubject(subjects[subjects.length - 1]); // Select the most recent conversation by default
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchEmails();
  }, []);

  const emails = selectedSubject ? conversations[selectedSubject] : [];

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
  };

  const handleReplyClick = () => {
    if (!emails.length) return;

    const lastEmail = emails[emails.length - 1];
    setReplyMessage('');
    setReplySubject(
      lastEmail.subject.startsWith('Re:') ? lastEmail.subject : `Re: ${lastEmail.subject}`
    );
    setReplyTo(extractEmail(lastEmail.from));
    setShowReplyModal(true);
  };

const handleSendReply = async () => {
  if (!replyMessage.trim()) {
    alert('Please enter a message');
    return;
  }

  const staff = JSON.parse(localStorage.getItem('User')) || {}; // Assume you store the user in localStorage
  const staffName = staff.username || 'Staff Member';
  const staffRank = staff.role || 'Support';
  const lastEmail = emails[emails.length - 1];

const fullMessage = `
<p>Dear ${extractEmail(lastEmail.from)},</p>

<p>${replyMessage.replace(/\n/g, '<br>')}</p>

<table style="margin-top: 2rem;">
  <tr>
    <td style="vertical-align: middle; padding-right: 10px;">
      <img src="https://flat-studios.vercel.app/cdn/image/logo.png" alt="Flat Studios Logo" width="40" height="40" style="border-radius: 8px; color:#000" />
    </td>
    <td style="vertical-align: middle; font-family: sans-serif; color: #000;">
      <p style="margin: 0;"><strong>${staffName}</strong></p>
      <p style="margin: 0;">${staffRank}</p>
      <p style="margin: 0; color:#283335;"><u>Flat Studios</u></p>
    </td>
  </tr>
</table>
`;


  setSending(true);
  try {
    await axios.post('/api/contact/emails/reply', {
      to: extractEmail(lastEmail.from),
      subject: replySubject.startsWith('Re:') ? replySubject : `Re: ${replySubject}`,
      message: fullMessage,
      inReplyTo: lastEmail.messageId,
    });
    alert('Reply sent!');
    setReplyMessage('');
    setShowReplyModal(false);
  } catch (error) {
    console.error(error);
    alert('Failed to send reply');
  } finally {
    setSending(false);
  }
};

  return (
    <>
      <main className="flex h-[calc(95vh-7.5rem)] text-white">
        <aside className="w-80 bg-[#283335] border border-white/10 overflow-y-auto">
          <h2 className="text-lg font-bold px-4 py-3 border-b border-white/10">Email Conversations</h2>
          {Object.keys(conversations).length === 0 ? (
            <div className="text-white/60 text-center py-6">No emails found</div>
          ) : (
            Object.keys(conversations).reverse().map((subject) => (
              <button
                key={subject}
                onClick={() => handleSelectSubject(subject)}
                className={`w-full text-left px-4 py-3 border-b border-white/10 transition ${
                  selectedSubject === subject ? 'bg-black/30 text-white' : 'hover:bg-black/10 text-white/80'
                }`}
              >
                <div className="font-medium truncate">{subject || '(No Subject)'}</div>
                <div className="text-sm text-white/60 truncate">
                  {new Date(conversations[subject][0].date).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </aside>

        <section className="flex-1 p-6 bg-[#1e1e1e] overflow-y-auto flex flex-col">
          {emails.length ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{selectedSubject || '(No Subject)'}</h1>
                  <p className="text-white/60 mt-1">
                    From: {extractEmail(emails[emails.length - 1].from)} ·{' '}
                    {new Date(emails[emails.length - 1].date).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleReplyClick}
                    aria-label="Reply"
                    className="hover:text-blue-400"
                    title="Reply"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 10h11M3 6h11m-7 8l-4 4m0 0l4 4m-4-4h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-4 overflow-auto flex-grow">
                {[...emails].reverse().map((email, i) => (
                  <div
                    key={i}
                    className="bg-white/10 p-5 rounded-xl border border-white/20 whitespace-pre-wrap text-white/90"
                  >
                    <p className="text-sm text-white/60 mb-2">
                      <strong>{extractEmail(email.from)}</strong> ·{' '}
                      {new Date(email.date).toLocaleString()}
                    </p>
                    <div
  className="prose prose-invert max-w-none"
  dangerouslySetInnerHTML={{ __html: email.html || email.text || 'No message content' }}
/>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-white/60 text-lg">Select a conversation to view it</div>
          )}
        </section>
      </main>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50 px-4">
          <div className="bg-[#283335] p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto flex flex-col">
            <h2 className="text-xl font-bold mb-4">Reply to Email</h2>

            <label className="block mb-1 font-semibold" htmlFor="reply-to">
              To
            </label>
            <input
              id="reply-to"
              type="email"
              className="w-full mb-4 p-2 rounded bg-[#1e1e1e] text-white border border-white/20 focus:outline-none"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
            />

            <label className="block mb-1 font-semibold" htmlFor="reply-subject">
              Subject
            </label>
            <input
              id="reply-subject"
              type="text"
              className="w-full mb-4 p-2 rounded bg-[#1e1e1e] text-white border border-white/20 focus:outline-none"
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
            />

            <label className="block mb-1 font-semibold" htmlFor="reply-message">
              Message
            </label>
            <textarea
              id="reply-message"
              rows={6}
              className="w-full mb-4 p-2 rounded bg-[#1e1e1e] text-white border border-white/20 focus:outline-none"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here..."
            />

            {/* Quoted original email */}
            <div className="mt-4 p-4 border-l-4 border-white/40 bg-[#1a1a1a] text-white/70 text-sm whitespace-pre-wrap overflow-auto max-h-40">
              <p>
                On {new Date(emails[emails.length - 1].date).toLocaleString()},{' '}
                {extractEmail(emails[emails.length - 1].from)} wrote:
              </p>
              <blockquote className="mt-2 border-l-2 border-white/30 pl-4 italic text-white/60"
              dangerouslySetInnerHTML={{ __html: emails[emails.length - 1].html || emails[emails.length - 1].text || 'No message content' }}
              >              
              </blockquote>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
