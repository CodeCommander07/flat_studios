'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import EmailStatusControls from '@/components/EmailTags';
import AuthWrapper from '@/components/AuthWrapper';

const tagColors = {
  Important: 'bg-red-600 text-white',
  'General Support': 'bg-blue-600 text-white',
  Accounts: 'bg-green-600 text-white',
  Billing: 'bg-yellow-600 text-black',
  Other: 'bg-gray-600 text-white',
  Test: 'bg-purple-600 text-white',
  'Feature Request': 'bg-orange-600 text-white',
};


const extractEmail = (address) => {
  const match = address.match(/<(.+)>/);
  return match ? match[1] : address;
};

export default function ContactEmailsPage() {
  const [conversations, setConversations] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [sending, setSending] = useState(false);

  // Add state to distinguish between replying to an email or composing a new one
  const [isNewEmail, setIsNewEmail] = useState(false);

  useEffect(() => {
    async function fetchEmails() {
      try {
        const res = await axios.get('/api/contact/emails');
        setConversations(res.data.conversations);
        const subjects = Object.keys(res.data.conversations);
        if (subjects.length) {
          setSelectedSubject(subjects[subjects.length - 1]); // Select the most recent subject by default
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchEmails();
  }, []);

  const emails = selectedSubject ? conversations[selectedSubject] : [];
  const refreshConversations = async () => {
  try {
    const res = await axios.get('/api/contact/emails');
    setConversations(res.data.conversations);

    if (selectedSubject && res.data.conversations[selectedSubject]) {
      setSelectedSubject(selectedSubject);
    } else {
      // If deleted, fallback to latest subject
      const subjects = Object.keys(res.data.conversations);
      if (subjects.length) {
        setSelectedSubject(subjects[subjects.length - 1]);
      } else {
        setSelectedSubject(null);
      }
    }
  } catch (err) {
    console.error('Refresh failed:', err);
  }
};

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
    setIsNewEmail(false);
    setShowReplyModal(true);
  };

  // New function to open the modal for composing a new email
  const handleNewEmailClick = () => {
    setReplyMessage('');
    setReplySubject('');
    setReplyTo('');
    setIsNewEmail(true);
    setShowReplyModal(true);
  };

  const handleClose = () => {
    setSelectedSubject(null);
  };
  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    let fullMessage
    const staff = JSON.parse(localStorage.getItem('user')) || {}; // Assume you store the user in localStorage
    const staffName = staff.username || 'Staff Member';
    const staffRank = staff.role || 'Support';

    if (isNewEmail) {
          fullMessage = `
<p>Dear ${replyTo || 'User'},</p>

<p>${replyMessage.replace(/\n/g, '<br>')}</p>

<p style="color:#ff0000">To start this ticket please reply to this email!</p>
<table style="margin-top: 2rem;">
  <tr>
    <td style="vertical-align: middle; padding-right: 10px;">
      <Image src="https://yapton.vercel.app/cdn/image/colour_logo.png" alt="Flat Studios Logo" width="40" height="40" style="border-radius: 8px; color:#000" />
    </td>
    <td style="vertical-align: middle; font-family: sans-serif; color: #000;">
      <p style="margin: 0;"><strong>${staffName}</strong></p>
      <p style="margin: 0;">${staffRank}</p>
      <p style="margin: 0; color:#283335;"><u>Flat Studios</u></p>
    </td>
  </tr>
</table>
`
    }else{
    fullMessage = `
<p>Dear ${replyTo || 'User'},</p>

<p>${replyMessage.replace(/\n/g, '<br>')}</p>

<table style="margin-top: 2rem;">
  <tr>
    <td style="vertical-align: middle; padding-right: 10px;">
      <Image src="https://yapton.vercel.app/cdn/image/colour_logo.png" alt="Flat Studios Logo" width="40" height="40" style="border-radius: 8px; color:#000" />
    </td>
    <td style="vertical-align: middle; font-family: sans-serif; color: #000;">
      <p style="margin: 0;"><strong>${staffName}</strong></p>
      <p style="margin: 0;">${staffRank}</p>
      <p style="margin: 0; color:#283335;"><u>Flat Studios</u></p>
    </td>
  </tr>
</table>
`;}

    setSending(true);
    try {
      await axios.post('/api/contact/emails/reply', {
        to: replyTo,
        subject: replySubject.startsWith('Re:') ? replySubject : `Re: ${replySubject}`,
        message: fullMessage,
        inReplyTo: isNewEmail ? null : emails.length ? emails[emails.length - 1].messageId : null,
      });
      alert('Email sent!');
      setReplyMessage('');
      setShowReplyModal(false);
    } catch (error) {
      console.error(error);
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
    <AuthWrapper requiredRole="devPhase">
      <main className="flex h-[calc(95vh-7.25rem)] text-white">
        <aside className="w-80 bg-[#283335] border border-white/10 overflow-y-auto">
          <h2 className="text-lg font-bold px-4 py-3 border-b border-white/10 flex items-center justify-between">
            Email Conversations
            <button
              onClick={handleNewEmailClick}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
            >
              New Email
            </button>
          </h2>
          {Object.keys(conversations).length === 0 ? (
            <div className="text-white/60 text-center py-6">No emails found</div>
          ) : (
Object.keys(conversations).reverse().map((subject) => {
  const emails = conversations[subject];
  const latest = emails[emails.length - 1];

  const isFlagged = latest?.flagged;
  const tags = latest?.tags || [];

  return (
    <button
      key={subject}
      onClick={() => handleSelectSubject(subject)}
      className={`w-full text-left px-4 py-3 border-b border-white/10 transition
        ${isFlagged ? 'bg-yellow-900 text-white' : ''}
        ${selectedSubject === subject ? 'bg-black/30 text-white' : 'hover:bg-black/10 text-white/80'}
      `}
    >
      <div className="font-medium truncate flex items-center justify-between">
        <span className="truncate">
          {subject || '(No Subject)'}
        </span>

        <div className="ml-2 flex gap-1 flex-wrap">
          
{tags.map(tag => {
  const style = tagColors[tag] || 'bg-gray-600 text-white';

  return (
    <span
      key={tag}
      className={`text-xs px-2 py-0.5 rounded-full ${style}`}
    >
      {tag}
    </span>
  );
})}
        </div>
      </div>

      <div className="text-sm text-white/60 truncate">
        {new Date(latest.date).toLocaleString()}
      </div>
    </button>
  );
})


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
                  <button onClick={handleReplyClick} title="Reply" className="hover:text-blue-400">
                    📩
                  </button>

                  <button onClick={handleClose} title="Close" className="hover:text-gray-400">
                    ❌
                  </button>
                </div>
              </div>
<EmailStatusControls
  messageId={emails[emails.length - 1].messageId}
  onStatusChange={refreshConversations}
/>

              <div className="flex flex-col space-y-4 overflow-auto flex-grow">
                {emails
  .slice(0)
  .reverse()
  .map((email, i) => (
    <div
      key={i}
      className="relative bg-white/10 p-5 rounded-xl border border-white/20 whitespace-pre-wrap text-white/90"
    >
      {email.flagged && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded-t-xl">
          FLAGGED
        </div>
      )}

      <p className="text-sm text-white/60 mb-2 mt-4">
        <strong>{extractEmail(email.from)}</strong> ·{' '}
        {new Date(email.date).toLocaleString()}
      </p>
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{
          __html: email.html || email.text || 'No message content',
        }}
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

      {/* Reply / New Email Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50 px-4">
          <div className="bg-[#283335] p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto flex flex-col">
            <h2 className="text-xl font-bold mb-4">{isNewEmail ? 'New Email' : 'Reply to Email'}</h2>

            <label className="block mb-1 font-semibold" htmlFor="reply-to">
              To
            </label>
            <input
              id="reply-to"
              type="email"
              className="w-full mb-4 p-2 rounded bg-[#1e1e1e] text-white border border-white/20 focus:outline-none"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="recipient@example.com"
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
              placeholder="Email Subject"
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
              placeholder="Type your message here..."
            />

            {/* Quoted original email only in reply mode */}
            {!isNewEmail && emails.length > 0 && (
              <div
                className="mt-4 p-4 border-l-4 border-white/40 bg-[#1a1a1a] text-white/70 text-sm whitespace-pre-wrap overflow-auto max-h-40"
                dangerouslySetInnerHTML={{
                  __html:
                    `<p>On ${new Date(emails[emails.length - 1].date).toLocaleString()}, ${extractEmail(
                      emails[emails.length - 1].from
                    )} wrote:</p>` +
                    (emails[emails.length - 1].html || emails[emails.length - 1].text || 'No message content'),
                }}
              />
            )}

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
                {sending ? 'Sending...' : isNewEmail ? 'Send Email' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
      </AuthWrapper>
    </>
  );
}
