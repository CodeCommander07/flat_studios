'use client';
import { useEffect, useState } from 'react';

export default function ManageSubscriptionPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
      fetch(`/api/newsletter/manage?email=${encodeURIComponent(emailParam)}`)
        .then((res) => res.json())
        .then((data) => {
          setSubscribed(Boolean(data.subscribed));
        });
    }
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    const res = await fetch('/api/newsletter/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, subscribed }),
    });
    const data = await res.json();
    setStatus(data.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f13] text-white px-4">
      <div className="max-w-md bg-[#111827] p-8 rounded-2xl border border-white/10 shadow-lg text-center">
        <h1 className="text-2xl font-semibold mb-4">Manage Email Preferences</h1>

        <form onSubmit={handleSave} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-md bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
                    <input
            type="text"
            placeholder="Enter your name (Roblox username, Discord username, etc)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-md bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex items-center justify-center gap-2">
            <input
              type="checkbox"
              id="subscribe"
              checked={subscribed}
              onChange={(e) => setSubscribed(e.target.checked)}
              className="w-5 h-5 accent-blue-500"
            />
            <label htmlFor="subscribe" className="text-white/80">
              Receive email updates
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>

          {status && <p className="text-sm text-white/70 mt-3">{status}</p>}
        </form>
      </div>
    </div>
  );
}
