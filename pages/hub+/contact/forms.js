'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ContactFormsPage() {
  const [data, setData] = useState({ requests: [], emails: [] });
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function fetchForms() {
      try {
        const res = await axios.get('/api/contact/forms');
 setData(res.data);
        setSelected(res.data.requests[0] || res.data.emails[0] || null);
      } catch (err) {
        console.error(err);
      }
    }
    fetchForms();
  }, []);

  return (
    <main className="flex h-[calc(95vh-7.5rem)] text-white">
      <aside className="w-72 bg-[#283335] border-r border-white/10 overflow-y-auto">
        <h2 className="text-lg font-bold px-4 py-3 border-b border-white/10">Contact Forms</h2>
        {data.requests.length === 0 ? (
  <div className="text-white/60 text-center py-6">No contact forms found</div>
) : (
  data.requests.map((r) => (
          <button
            key={r._id}
            onClick={() => setSelected(r)}
            className={`w-full text-left px-4 py-3 border-b border-white/10 transition ${
              selected?._id === r._id ? 'bg-black/30 text-white' : 'hover:bg-black/10 text-white/80'
            }`}
          >
            <div className="font-medium truncate">{r.subject}</div>
            <div className="text-sm text-white/60 truncate">
              {r.fromEmail} · {new Date(r.createdAt).toLocaleString()}
            </div>
          </button>
        )))}
      </aside>

      <section className="flex-1 p-6 bg-[#1e1e1e] overflow-y-auto">
        {selected ? (
          <>
            <h1 className="text-2xl font-bold mb-2">{selected.subject}</h1>
            <p className="text-white/60 mb-6">
              From: {selected.fromEmail} · {new Date(selected.createdAt).toLocaleString()}
            </p>
            <div className="bg-white/10 p-5 rounded-xl border border-white/20 whitespace-pre-wrap text-white/90">
              {selected.message || selected.body || 'No message content'}
            </div>
          </>
        ) : (
          <div className="text-white/60 text-lg text-center">Select a contact form to view</div>
        )}
      </section>
    </main>
  );
}
