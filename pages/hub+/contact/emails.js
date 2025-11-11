'use client';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { MailPlus, Reply, X, Loader2, Trash, Search } from 'lucide-react';
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

const extractEmail = (address = '') => {
  // Handles "Name <email@...>" and plain "email@..."
  const match = address.match(/<(.+?)>/);
  return match ? match[1] : address.trim();
};

export default function ContactEmailsPage() {
  const [conversations, setConversations] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [sending, setSending] = useState(false);
  const [isNewEmail, setIsNewEmail] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchEmails();
  }, []);

  async function fetchEmails() {
    try {
      const res = await axios.get('/api/contact/emails');
      setConversations(res.data.conversations || {});
      const subjects = Object.keys(res.data.conversations || {});
      if (subjects.length) setSelectedSubject((prev) => prev ?? subjects[subjects.length - 1]);
    } catch (err) {
      console.error(err);
    }
  }

  const emails = selectedSubject ? conversations[selectedSubject] : [];

  const refreshConversations = async () => {
    await fetchEmails();
  };

  const handleReplyClick = () => {
    if (!emails.length) return;
    const lastEmail = emails[emails.length - 1];
    setReplyMessage('');
    setReplySubject(lastEmail.subject.startsWith('Re:') ? lastEmail.subject : `Re: ${lastEmail.subject}`);
    setReplyTo(extractEmail(lastEmail.from));
    setIsNewEmail(false);
    setShowReplyModal(true);
  };

  const handleNewEmailClick = () => {
    setReplyMessage('');
    setReplySubject('');
    setReplyTo('');
    setIsNewEmail(true);
    setShowReplyModal(true);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return alert('Please enter a message');

    const staff = JSON.parse(localStorage.getItem('User')) || {};
    const staffName = staff.username || 'Staff Member';
    const staffRank = staff.role || 'Support';

    const fullMessage = `
      <p>Dear ${replyTo || 'User'},</p>
      <p>${replyMessage.replace(/\n/g, '<br>')}</p>
      ${isNewEmail ? `<p style="color:#ff0000">To start this ticket please reply to this email!</p>` : ''}
      <table style="margin-top: 2rem;">
        <tr>
          <td style="vertical-align: middle; padding-right: 10px;">
            <img src="https://yapton.vercel.app/cdn/image/colour_logo.png" width="40" height="40" style="border-radius: 8px;" />
          </td>
          <td style="vertical-align: middle; font-family: sans-serif; color: #000;">
            <p style="margin: 0;"><strong>${staffName}</strong></p>
            <p style="margin: 0;">${staffRank}</p>
            <p style="margin: 0; color:#283335;"><u><a href="https://yapton.vercel.app/">Flat Studios</a></u></p>
          </td>
        </tr>
      </table>
    `;

    setSending(true);
    try {
      await axios.post('/api/contact/emails/reply', {
        to: replyTo,
        subject: replySubject.startsWith('Re:') ? replySubject : `Re: ${replySubject}`,
        message: fullMessage,
        inReplyTo: isNewEmail ? null : emails.at(-1)?.messageId || null,
      });
      alert('Email sent!');
      setShowReplyModal(false);
      fetchEmails();
    } catch (error) {
      console.error(error);
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedSubject) return;
    const confirmDelete = confirm(`Delete the entire conversation: "${selectedSubject}"?`);
    if (!confirmDelete) return;
    try {
      await axios.post('/api/contact/emails/delete', { subject: selectedSubject });
      alert('Conversation deleted.');
      setSelectedSubject(null);
      fetchEmails();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation.');
    }
  };

  // Build a searchable list of conversations (subject + latest email info)
  const convoList = useMemo(() => {
    const subjects = Object.keys(conversations || {});
    return subjects
      .map((subject) => {
        const thread = conversations[subject] || [];
        const latest = thread[thread.length - 1];
        const tags = latest?.tags || [];
        const sender = extractEmail(latest?.from || '');
        return {
          subject,
          latestDate: latest?.date ? new Date(latest.date) : null,
          latestFrom: sender,
          tags,
          count: thread.length,
        };
      })
      // newest last like before; we’ll reverse in render if needed
      .sort((a, b) => (a.latestDate?.getTime() || 0) - (b.latestDate?.getTime() || 0));
  }, [conversations]);

  // Filter by subject, sender, or tag
  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return convoList;
    return convoList.filter((c) => {
      const inSubject = (c.subject || '').toLowerCase().includes(q);
      const inFrom = (c.latestFrom || '').toLowerCase().includes(q);
      const inTags = (c.tags || []).some((t) => (t || '').toLowerCase().includes(q));
      return inSubject || inFrom || inTags;
    });
  }, [query, convoList]);

  // Keep selected subject if it's still in the filtered set; otherwise clear selection
  useEffect(() => {
    if (!selectedSubject) return;
    const stillPresent = filteredList.some((c) => c.subject === selectedSubject);
    if (!stillPresent) setSelectedSubject(null);
  }, [filteredList, selectedSubject]);

  return (
    <AuthWrapper requiredRole="devPhase">
      <main className="max-w-10xl mx-auto px-8 mt-8 text-white">
        <div className="grid md:grid-cols-5 gap-8">
          {/* LEFT PANEL — Email list + Search */}
          <div className="col-span-2 bg-[#283335]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-lg max-h-[666px] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Email Conversations</h1>
              <button
                onClick={handleNewEmailClick}
                className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg text-sm font-medium"
              >
                <MailPlus size={16} className="inline mr-1" /> New Email
              </button>
            </div>

            {/* Search bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subject, sender, or tag…"
                className="w-full pl-9 pr-3 py-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 flex-grow pr-2">
              {Object.keys(conversations).length === 0 ? (
                <p className="text-white/60 text-sm">No conversations found.</p>
              ) : filteredList.length === 0 ? (
                <p className="text-white/60 text-sm">No results.</p>
              ) : (
                filteredList
                  .slice() // keep a copy
                  .reverse() // show most recent at top
                  .map(({ subject, latestDate, latestFrom, tags, count }) => (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(subject)}
                      className={`w-full text-left mb-2 p-3 rounded-lg border border-white/10 transition-all ${
                        selectedSubject === subject ? 'bg-white/10 border-white/20' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-green-400 truncate">
                          {subject || '(No Subject)'}
                        </p>
                        <div className="ml-2 flex gap-1 flex-wrap">
                          {tags.map((tag) => {
                            const style = tagColors[tag] || 'bg-gray-600 text-white';
                            return (
                              <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${style}`}>
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {/* NEW: show sender + date + count */}
                      <div className="mt-1 flex items-center justify-between text-xs text-white/60">
                        <span className="truncate">
                          From: {latestFrom || 'Unknown'}{count ? ` • ${count} msg${count > 1 ? 's' : ''}` : ''}
                        </span>
                        <span>{latestDate ? latestDate.toLocaleString() : ''}</span>
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* RIGHT PANEL — Email view */}
          <div className="col-span-3 bg-[#283335]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-lg max-h-[666px] overflow-hidden flex flex-col">
            {emails.length ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedSubject}</h2>
                    <p className="text-white/60 text-sm">
                      From: {extractEmail(emails.at(-1).from)} · {new Date(emails.at(-1).date).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleReplyClick} className="hover:text-blue-400" title="Reply">
                      <Reply size={18} />
                    </button>
                    <button onClick={handleDeleteConversation} className="hover:text-red-400" title="Delete Conversation">
                      <Trash size={18} />
                    </button>
                    <button onClick={() => setSelectedSubject(null)} className="hover:text-gray-400" title="Close">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <EmailStatusControls
                  messageId={emails.at(-1).messageId}
                  onStatusChange={refreshConversations}
                />

                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 flex-grow space-y-4 mt-3 pr-2">
                  {emails
                    .slice()
                    .reverse()
                    .map((email, i) => (
                      <div key={i} className="bg-white/10 p-4 rounded-xl border border-white/20">
                        {email.flagged && (
                          <div className="text-yellow-400 text-xs mb-1 font-semibold">⚠ FLAGGED</div>
                        )}
                        <p className="text-sm text-white/70 mb-2">
                          <strong>{extractEmail(email.from)}</strong> · {new Date(email.date).toLocaleString()}
                        </p>
                        <div
                          className="prose prose-invert max-w-none text-white/90"
                          dangerouslySetInnerHTML={{
                            __html: email.html || email.text || 'No message content',
                          }}
                        />
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="text-white/60 text-center mt-24">Select a conversation to view it.</div>
            )}
          </div>
        </div>

        {/* Reply/New Email Modal */}
        {showReplyModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#283335] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
              <h2 className="text-xl font-bold mb-4">
                {isNewEmail ? 'Compose New Email' : 'Reply to Email'}
              </h2>

              <label className="block text-sm mb-1">To</label>
              <input
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                className="w-full p-2 rounded bg-white/10 border border-white/20 mb-3 focus:ring-2 focus:ring-blue-500"
              />

              <label className="block text-sm mb-1">Subject</label>
              <input
                type="text"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                className="w-full p-2 rounded bg-white/10 border border-white/20 mb-3 focus:ring-2 focus:ring-blue-500"
              />

              <label className="block text-sm mb-1">Message</label>
              <textarea
                rows="6"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="w-full p-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-blue-500 resize-none mb-3"
              />

              {!isNewEmail && emails.length > 0 && (
                <div
                  className="mt-4 p-4 bg-black/30 rounded-lg border-l-4 border-white/40 text-white/70 text-sm"
                  dangerouslySetInnerHTML={{
                    __html:
                      `<p>On ${new Date(emails.at(-1).date).toLocaleString()}, ${extractEmail(
                        emails.at(-1).from
                      )} wrote:</p>` +
                      (emails.at(-1).html || emails.at(-1).text || 'No message content'),
                  }}
                />
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={sending}
                  className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  {sending ? <Loader2 className="animate-spin w-4 h-4" /> : <Reply size={16} />}
                  {sending ? 'Sending...' : isNewEmail ? 'Send Email' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollbar styling */}
        <style jsx global>{`
          .scrollbar-thin::-webkit-scrollbar {
            width: 8px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 8px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255, 255, 255, 0.25);
          }
        `}</style>
      </main>
    </AuthWrapper>
  );
}
