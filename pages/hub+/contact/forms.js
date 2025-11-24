'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Loader2, Mail, Reply } from 'lucide-react';

export default function ContactFormsPage() {
  const [data, setData] = useState({ requests: [] });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [replySuccess, setReplySuccess] = useState('');

  const getStatusPill = (status) => {
    switch (status) {
      case "read":
        return (
          <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
          bg-orange-500/20 text-orange-300 border border-orange-500/40">
            ● Read
          </span>
        );

      case "replied":
        return (
          <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
          bg-green-500/20 text-green-300 border border-green-500/40">
            ● Replied
          </span>
        );
    }

    return (
      <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
        bg-red-500/20 text-red-300 border border-red-500/40">
        ● Unread
      </span>
    );
  };

  useEffect(() => {
    async function fetchForms() {
      try {
        const res = await axios.get('/api/contact/forms');
        setData({ requests: res.data.requests || [] });
        setSelected(res.data.requests?.[0] || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchForms();
  }, []);

  const filtered = (data.requests || []).filter((f) => {
    const q = query.toLowerCase();
    return (
      f.subject?.toLowerCase().includes(q) ||
      f.fromEmail?.toLowerCase().includes(q)
    );
  });

  const handleSelect = async (f) => {
    setSelected(f);

    // ✅ Only mark as read if:
    // - it has NO status
    // - NOT already read/replied
    if (!f.status) {
      try {
        await axios.patch('/api/contact/forms', {
          id: f._id,
          status: "read"
        });

        // ✅ update UI without reload
        setData(prev => ({
          ...prev,
          requests: prev.requests.map(r =>
            r._id === f._id ? { ...r, status: "read" } : r
          )
        }));

        setSelected(prev => ({ ...prev, status: "read" }));
      } catch {}
    }
  };

  const handleSendReply = async () => {
    if (!selected || !replyBody.trim()) {
      setReplyError('Please write a message before sending.');
      return;
    }

    setSending(true);
    setReplyError('');
    setReplySuccess('');

    try {
      const staff = JSON.parse(localStorage.getItem('User')) || {};
      const staffName = staff.username || 'Staff Member';
      const staffRank = staff.role || 'Support';

      const replyHtml = `
<p>Dear ${selected.name || 'User'},</p>
${replyBody}
<br>
<strong>${staffName}</strong><br>
${staffRank}<br>
Flat Studios
`;

      await axios.post('/api/contact/emails/reply', {
        to: selected.fromEmail,
        subject: selected.subject?.startsWith('Re:')
          ? selected.subject
          : `Re: ${selected.subject || ''}`,
        message: replyHtml,
        staff: staffName
      });

      await axios.patch('/api/contact/forms', {
        id: selected._id,
        status: "replied"
      });

      // ✅ update UI
      setData(prev => ({
        ...prev,
        requests: prev.requests.map(r =>
          r._id === selected._id ? { ...r, status: "replied" } : r
        )
      }));

      setSelected(prev => ({ ...prev, status: "replied" }));

      setReplySuccess('Reply sent.');
      setShowReply(false);
      setReplyBody('');
    } catch (err) {
      console.error(err);
      setReplyError('Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthWrapper requiredRole="hubPlus">
      <main className="max-w-6xl mx-auto px-6 lg:px-8 mt-8 text-white">

        <div className="grid md:grid-cols-5 gap-8">

          {/* LEFT LIST */}
          <div className="col-span-2 bg-[#283335]/80 border border-white/10 rounded-2xl p-5">
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-2.5 mb-4 rounded-lg bg-[#1f272c]"
            />

            <div className="overflow-y-auto flex-grow pr-1">
              {filtered.reverse().map((f) => (
                <button
                  key={f._id}
                  onClick={() => handleSelect(f)}
                  className={`w-full text-left mb-2 p-3 rounded-xl border border-white/10 text-sm
                  ${selected?._id === f._id
                    ? 'bg-[#283335] border-white/30'
                    : 'bg-[#1f272c] hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-semibold text-white truncate">
                      {f.subject || '(No Subject)'}
                    </div>
                    {getStatusPill(f.status)}
                  </div>
                  <p className="text-[11px] text-white/60 truncate">
                    {f.fromEmail} · {new Date(f.createdAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT DETAIL */}
          <div className="col-span-3 bg-[#283335]/80 border border-white/10 rounded-2xl p-6">
            {selected ? (
              <>
                <h2 className="text-xl font-semibold mb-1">
                  {selected.subject || '(No Subject)'}
                </h2>

                <div className="mt-1">{getStatusPill(selected.status)}</div>

                <div className="mt-4">
                  {selected.message || selected.body}
                </div>

                <button
                  onClick={() => setShowReply(true)}
                  className="mt-4 px-4 py-2 rounded-full bg-green-600"
                >
                  Reply
                </button>
              </>
            ) : (
              <p>Select a contact form</p>
            )}
          </div>
        </div>
      </main>
    </AuthWrapper>
  );
}
