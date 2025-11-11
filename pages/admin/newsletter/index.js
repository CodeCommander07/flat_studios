'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function NewslettersList() {
  const [items, setItems] = useState([]);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const res = await axios.get('/api/news');
    setItems(res.data || []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    const res = await axios.post('/api/news', { title: 'Untitled Newsletter' });
    setCreating(false);
    window.location.href = `/admin/newsletter/editor/${res.data._id}`;
  };

  return (
    <div className="text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Newsletters</h1>
          <button onClick={create} disabled={creating} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur">
            {creating ? 'Creating…' : 'New Newsletter'}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((n) => (
            <Link key={n._id} href={`/admin/newsletters/editor/${n._id}`} className="block rounded-2xl p-4 bg-white/5 hover:bg-white/10 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">{n.title || 'Untitled Newsletter'}</p>
                <span className="text-xs px-2 py-1 rounded bg-white/10">{n.status}</span>
              </div>
              <p className="text-xs text-white/60">Updated {new Date(n.updatedAt).toLocaleString()}</p>
            </Link>
          ))}
          {!items.length && (
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-white/70">
              No newsletters yet. Click <b>New Newsletter</b> to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
