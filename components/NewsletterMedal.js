'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function NewsletterModal() {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShow(true), 2000); // Delay show
    return () => clearTimeout(timeout);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to subscribe.');

      setSubmitted(true);
      setTimeout(() => setShow(false), 3000); // Auto-close
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm animate-slide-in">
      <div className="bg-white/10 text-white border border-white/20 backdrop-blur-md p-6 rounded-xl shadow-lg relative">
        <button
          onClick={() => setShow(false)}
          className="absolute top-3 right-3 hover:text-red-400"
        >
          <X />
        </button>
        <h2 className="text-xl font-bold mb-4">📬 Join Our Newsletter</h2>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Username"
                className="w-full px-3 py-2 rounded bg-white/20 border border-white/30 text-white"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full px-3 py-2 rounded bg-white/20 border border-white/30 text-white"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        ) : (
          <p className="text-green-400 text-center font-semibold">Thanks for subscribing! ✅</p>
        )}
      </div>
    </div>
  );
}
