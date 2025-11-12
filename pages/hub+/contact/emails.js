'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  MailPlus,
  Reply,
  Loader2,
  Search,
  Trash,
  Flag,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import AuthWrapper from '@/components/AuthWrapper';

const presetColors = [
  "#ffffff", "#f87171", "#facc15", "#4ade80", "#60a5fa",
  "#a78bfa", "#f472b6", "#f97316", "#f43f5e", "#22d3ee",
];

const extractEmail = (address = '') => {
  const match = address.match(/<(.+?)>/);
  return match ? match[1] : address.trim();
};

const cleanMessage = (html) => {
  if (!html) return 'No message content';
  return html.split(/-{3,}\s*Please reply above this line\s*-{3,}/i)[0];
};

export default function ContactEmailsPage() {
  const [conversations, setConversations] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#ffffff");
  const [staffName, setStaffName] = useState('');
  const [staffRank, setStaffRank] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const pickerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    const staff = JSON.parse(localStorage.getItem('User')) || {};
    setStaffName(staff.username || 'Staff Member');
    setStaffRank(staff.role || 'Support');
  }, []);

  async function fetchEmails() {
    try {
      const res = await axios.get('/api/contact/emails');
      setConversations(res.data.conversations || {});
      const subjects = Object.keys(res.data.conversations || {});
      if (subjects.length)
        setSelectedSubject((prev) => prev ?? subjects[subjects.length - 1]);
    } catch (err) {
      console.error(err);
    }
  }

  const emails = selectedSubject ? conversations[selectedSubject] : [];

  const handleSendReply = async () => {
    const content = editorRef.current?.innerHTML.trim();
    if (!content) return alert('Please enter a message.');

    const senderName = emails?.[0]?.senderName || "User"
      ;
    const lastEmail = emails.at(-1);
    const subjectLine = lastEmail?.subject || 'Re: Support Ticket';
    const toAddress = extractEmail(emails[0]?.from || '');

    const staff = JSON.parse(localStorage.getItem('User')) || {};
    const staffName = staff.username || 'Staff Member';
    const staffRank = staff.role || 'Support';

    const fullMessage = `
      <div style="font-family: Arial, sans-serif; color: #000;">
        <div style="margin: 25px 0; text-align: center; color: #444;">
          <hr style="border:none;border-top:1px solid #ccc;margin:12px 0;">
          <p style="color:#888;font-size:13px;letter-spacing:0.5px;font-weight:600;font-family:'Segoe UI',sans-serif;">
            ——— <span style="color:#283335;">Please reply above this line</span> ———
          </p>
          <hr style="border:none;border-top:1px solid #ccc;margin:12px 0;">
        </div>
        <p>Dear ${senderName || 'User'},</p>
        ${content}
        <table style="margin-top:1rem;">
          <tr>
            <td style="vertical-align:middle;padding-right:10px;">
              <img src="https://yapton.vercel.app/cdn/image/colour_logo.png" width="48" height="48" style="border-radius:10px;" />
            </td>
            <td style="vertical-align:middle;font-family:'Segoe UI',sans-serif;color:#222;">
              <p style="margin:0;font-size:15px;"><strong>${staffName}</strong></p>
              <p style="margin:0;font-size:13px;color:#666;">${staffRank}</p>
              <p style="margin:0;font-size:13px;color:#283335;"><strong>Flat Studios</strong></p>
            </td>
          </tr>
        </table>
      </div>
    `;

    setSending(true);
    try {
      await axios.post('/api/contact/emails/reply', {
        staff: staffName,
        to: toAddress,
        subject: subjectLine,
        message: fullMessage,
        inReplyTo: lastEmail?.messageId || null,
      });
      editorRef.current.innerHTML = '';
      fetchEmails();
      setShowReplyBox(false);
    } catch (error) {
      console.error('Send reply failed:', error?.response?.data || error);
      alert('Failed to send email — check console for details.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedSubject) return;
    const confirmDelete = confirm(`Delete the entire conversation: "${selectedSubject}"?`);
    if (!confirmDelete) return;

    const threadId = emails.at(-1)?.threadId;
    if (!threadId) {
      alert('No thread ID found for this conversation.');
      return;
    }

    try {
      await fetch('/api/contact/emails/delete', {
        method: 'POST',
        body: JSON.stringify({ threadId }),
        headers: { 'Content-Type': 'application/json' },
      });
      alert('Conversation deleted.');
      setSelectedSubject(null);
      fetchEmails();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation.');
    }
  };


  const handleFlagConversation = async () => {
    if (!selectedSubject) return;
    try {
      await axios.post('/api/contact/emails/flag', { subject: selectedSubject });
      alert('Conversation flagged.');
    } catch (error) {
      console.error('Failed to flag conversation:', error);
      alert('Failed to flag conversation.');
    }
  };

  const format = (cmd) => document.execCommand(cmd, false, null);

  const convoList = useMemo(() => {
    const subjects = Object.keys(conversations || {});
    return subjects.map((subject) => {
      const thread = conversations[subject] || [];
      const latest = thread.at(-1);
      const sender = extractEmail(latest?.from || '');
      return {
        subject,
        latestDate: latest?.date ? new Date(latest.date) : null,
        latestFrom: sender,
        count: thread.length,
      };
    });
  }, [conversations]);

  return (
    <AuthWrapper requiredRole="hubPlus">
      <main className="max-w-10xl mx-auto px-4 sm:px-6 mt-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* SIDEBAR */}
          <div className="col-span-2 bg-[#283335]/80 border border-white/10 rounded-2xl p-5 backdrop-blur-lg max-h-[666px] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h1 className="text-xl md:text-2xl font-bold">Email Conversations</h1>
              <button
                onClick={() => setSelectedSubject(null)}
                className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg text-sm font-medium"
              >
                <MailPlus size={16} className="inline mr-1" /> New
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subject or sender…"
                className="w-full pl-9 pr-3 py-2 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <div className="overflow-y-auto flex-grow pr-2">
              {convoList.map(({ subject, latestFrom, count, latestDate }) => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`w-full text-left mb-2 p-3 rounded-lg border border-white/10 ${selectedSubject === subject
                    ? 'bg-white/10 border-white/20'
                    : 'hover:bg-white/5'
                    }`}
                >
                  <p className="font-semibold text-green-400 truncate text-sm md:text-base">
                    {subject || '(No Subject)'}
                  </p>
                  <div className="text-xs text-white/60 mt-1">
                    From: {latestFrom || 'Unknown'} • {count} msg
                    <span className="float-right">
                      {latestDate?.toLocaleTimeString() || ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-3 bg-[#283335]/80 border border-white/10 rounded-2xl p-5 backdrop-blur-lg flex flex-col max-h-[666px]">
            {emails.length ? (
              <>
                <div className="border-b border-white/10 pb-3 mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold mb-1">{selectedSubject}</h2>
                    <p className="text-white/70 text-sm">
                      <strong>From:</strong> {extractEmail(emails.at(-1).from)} ·{' '}
                      <strong>Received:</strong>{' '}
                      {new Date(emails.at(-1).date).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleFlagConversation}
                      className="bg-yellow-600 hover:bg-yellow-500 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1"
                    >
                      <Flag size={14} /> Flag
                    </button>

                    <button
                      onClick={handleDeleteConversation}
                      className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1"
                    >
                      <Trash size={14} /> Delete
                    </button>

                    <button
                      onClick={() => setShowReplyBox((v) => !v)}
                      className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1"
                    >
                      <Reply size={14} /> {showReplyBox ? 'Hide Reply' : 'Reply'}
                    </button>

                    <button
                      onClick={() => setSelectedSubject(null)}
                      className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1"
                    >
                      <X size={14} /> Close
                    </button>
                  </div>

                </div>

                {showReplyBox && (
                  <div className="border border-white/10 rounded-xl p-3 mb-4 bg-white/5 transition-all duration-300">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-2 flex-wrap">
                      <div className="flex items-center gap-2 mb-2 sm:mb-0 flex-wrap">
                        <button onClick={() => format('bold')} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-semibold">B</button>
                        <button onClick={() => format('italic')} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm italic font-semibold">I</button>
                        <button onClick={() => format('underline')} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm underline font-semibold">U</button>
                        <button
                          onClick={() => {
                            const url = prompt('Enter link URL:');
                            if (url) document.execCommand('createLink', false, url);
                          }}
                          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-semibold"
                        >
                          🔗
                        </button>
                        <div className="relative" ref={pickerRef}>
                          <button
                            onClick={() => setShowPicker((s) => !s)}
                            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-semibold flex items-center gap-2"
                          >
                            <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: currentColor }}></span>
                            🎨
                          </button>
                          {showPicker && (
                            <div className="absolute top-12 left-0 w-48 bg-[#1f2937]/90 border border-white/20 rounded-xl p-3 grid grid-cols-5 gap-2 z-50 backdrop-blur-lg shadow-lg">
                              {presetColors.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => {
                                    setCurrentColor(color);
                                    document.execCommand("foreColor", false, color);
                                    setShowPicker(false);
                                  }}
                                  style={{ backgroundColor: color }}
                                  className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform"
                                />
                              ))}
                              <label className="col-span-5 mt-2 flex items-center justify-center text-xs text-white/70 cursor-pointer hover:text-white/90">
                                Advanced
                                <input
                                  type="color"
                                  className="absolute opacity-0"
                                  onChange={(e) => {
                                    setCurrentColor(e.target.value);
                                    document.execCommand("foreColor", false, e.target.value);
                                    setShowPicker(false);
                                  }}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleSendReply}
                        disabled={sending}
                        className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 text-sm"
                      >
                        {sending ? <Loader2 className="animate-spin w-4 h-4" /> : <Reply size={16} />}
                        {sending ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>

                    {/* Editor */}
                    <div className="w-full p-3 bg-black/20 border border-white/20 rounded-lg text-white text-sm space-y-3">
                      <div contentEditable={false}>
                        <div style={{ margin: '25px 0', textAlign: 'center', color: '#888' }}>
                          <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '12px 0' }} />
                          <p style={{ color: '#888', fontSize: '13px', letterSpacing: '0.5px', fontWeight: 600 }}>
                            ——— <span style={{ color: '#ccc' }}>Please reply above this line</span> ———
                          </p>
                          <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '12px 0' }} />
                        </div>
                        <p className="text-white/70">Dear {emails?.[0]?.senderName || "User"},</p>
                      </div>

                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning={true}
                        className="min-h-[100px] bg-black/40 p-3 rounded-md focus:outline-none border border-white/10"
                        placeholder="Type your reply..."
                      ></div>

                      <div contentEditable={false}>
                        <table style={{ marginTop: '1rem' }}>
                          <tbody>
                            <tr>
                              <td style={{ verticalAlign: 'middle', paddingRight: '10px' }}>
                                <img src="https://yapton.vercel.app/cdn/image/colour_logo.png" width="48" height="48" style={{ borderRadius: '10px' }} alt="Flat Studios" />
                              </td>
                              <td style={{ verticalAlign: 'middle', fontFamily: 'Segoe UI, sans-serif', color: '#fff' }}>
                                <p style={{ margin: 0, fontSize: '15px' }}>
                                  <strong>{staffName}</strong>
                                </p>
                                <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>{staffRank}</p>
                                <p style={{ margin: 0, fontSize: '13px', color: '#8bf' }}>
                                  <strong>Flat Studios</strong>
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-grow overflow-y-auto space-y-4 pr-1">
                  {emails.slice().reverse().map((email, i) => (
                    <div
                      key={i}
                      className={`p-4 bg-black/30 rounded-lg border-l-4 ${email.from?.toLowerCase()?.includes('help@') ||
                        email.from?.toLowerCase()?.includes('flatstudios')
                        ? 'border-blue-400 text-white'
                        : 'border-orange-400 text-orange-100'
                        } text-sm`}
                    >
                      <div className="mb-2 flex justify-between items-center text-xs text-white/70">
                        <div>
                          {email.from?.toLowerCase()?.includes('help@') ||
                            email.from?.toLowerCase()?.includes('flatstudios') ? (
                            <>
                              💬 <strong className="text-white">
                                {email.staffName ||
                                  extractEmail(email.from) ||
                                  'Flat Studios Support'}
                              </strong>
                              {email.staffRole && <span className="text-white/80"> ({email.staffRole})</span>}{' '}
                              sent this message

                            </>
                          ) : (
                            <>
                              <strong className="text-white">{extractEmail(email.from)}</strong> replied
                            </>
                          )}
                        </div>
                        <span className="text-white/60">{new Date(email.date).toLocaleString()}</span>
                      </div>

                      <div
                        className="prose prose-invert max-w-none overflow-x-auto text-white"
                        dangerouslySetInnerHTML={{
                          __html: (() => {
                            let html = email.html || '';
                            let text = email.text || '';

                            if (
                              email.from?.toLowerCase()?.includes('help@') ||
                              email.from?.toLowerCase()?.includes('flatstudios')
                            ) {
                              html = (html || text)
                                .replace(/———.*Please reply above this line.*———/i, '')
                                .replace(/<hr[^>]*>/gi, '')
                                .replace(/^<blockquote[^>]*>/i, '')
                                .replace(/<\/blockquote>$/i, '')
                                .trim();

                              if (!html.includes('<') && text) {
                                html = text.replace(/\n/g, '<br>');
                              }

                              html = html.replace(
                                /color:\s*(black|#000|rgb\(0,\s*0,\s*0\))/gi,
                                'color:white'
                              );
                              html = `<div style="color:white;">${html}</div>`;

                              return html || '<p><i>[No message content]</i></p>';
                            }

                            html = (html || text)
                              .replace(/———.*Please reply above this line.*———/i, '')
                              .replace(/<hr[^>]*>/gi, '')
                              .replace(/<table[^>]*>[\s\S]*?Flat Studios[\s\S]*?<\/table>/gi, '')
                              .replace(/On\s.*wrote:/gis, '')
                              .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '')
                              .replace(/color:[^;"]+;?/gi, '')
                              .replace(/(<(p|div)[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/\2>)+/gi, '')
                              .replace(/^(\s|(&nbsp;)|(<br\s*\/?>)|(<(p|div)[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/\5>))+/, '')
                              .replace(/(\s|(&nbsp;)|(<br\s*\/?>)|(<(p|div)[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/\5>))+$/, '')
                              .trim();

                            if (!html && text) html = text.replace(/\n/g, '<br>');

                            return html || '<p><i>[No message content]</i></p>';
                          })(),
                        }}
                      />

                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-white/60 mt-24 text-sm sm:text-base">
                Select a conversation to view it.
              </p>
            )}
          </div>
        </div>
      </main>
    </AuthWrapper>
  );
}
