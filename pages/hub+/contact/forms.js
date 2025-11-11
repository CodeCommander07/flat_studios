'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import AuthWrapper from '@/components/AuthWrapper';
import { Loader2, Mail } from 'lucide-react';

export default function ContactFormsPage() {
  const [data, setData] = useState({ requests: [], emails: [] });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function fetchForms() {
      try {
        const res = await axios.get('/api/contact/forms');
        setData(res.data);
        const first =
          res.data.requests?.[0] || res.data.emails?.[0] || null;
        setSelected(first);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchForms();
  }, []);

  const allForms = [
    ...(data.requests || []),
    ...(data.emails || []),
  ];

  const filtered = allForms.filter(
    (f) =>
      f.subject?.toLowerCase().includes(query.toLowerCase()) ||
      f.fromEmail?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AuthWrapper requiredRole="hubPlus">
      <main className="max-w-10xl mx-auto px-8 mt-8 text-white">
        <div className="grid md:grid-cols-5 gap-8">
          {/* LEFT PANEL — Contact Form List */}
          <div className="col-span-2 bg-[#283335]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-lg max-h-[666px] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Mail className="text-green-400" size={20} /> Contact Forms
              </h1>
            </div>

            <input
              type="text"
              placeholder="Search by email or subject..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-2 mb-4 rounded bg-white/10 border border-white/20 focus:ring-2 focus:ring-green-500"
            />

            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 flex-grow pr-2">
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="animate-spin w-4 h-4" /> Loading forms...
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-gray-400 text-sm">No forms found.</p>
              ) : (
                filtered
                  .slice()
                  .reverse()
                  .map((f) => (
                    <button
                      key={f._id}
                      onClick={() => setSelected(f)}
                      className={`w-full text-left mb-2 p-3 rounded-lg border border-white/10 transition-all ${
                        selected?._id === f._id
                          ? 'bg-white/10 border-white/20'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="font-semibold text-green-400 truncate">
                        {f.subject || '(No Subject)'}
                      </div>
                      <p className="text-xs text-white/60 truncate">
                        {f.fromEmail} ·{' '}
                        {new Date(f.createdAt).toLocaleString()}
                      </p>
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* RIGHT PANEL — Selected Form Details */}
          <div className="col-span-3 bg-[#283335]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-lg max-h-[666px] overflow-hidden flex flex-col">
            {selected ? (
              <>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2">
                    {selected.subject || '(No Subject)'}
                  </h2>
                  <p className="text-white/60 text-sm">
                    From: {selected.fromEmail} ·{' '}
                    {new Date(selected.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 flex-grow pr-2">
                  <div className="bg-white/10 p-5 rounded-xl border border-white/20 whitespace-pre-wrap text-white/90">
                    {selected.message ||
                      selected.body ||
                      'No message content'}
                  </div>
                </div>
              </>
            ) : loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin w-4 h-4" /> Loading message...
              </div>
            ) : (
              <div className="text-white/60 text-center mt-24">
                Select a contact form to view it.
              </div>
            )}
          </div>
        </div>

        {/* Scrollbar Styling */}
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
