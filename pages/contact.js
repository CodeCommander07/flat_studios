'use client';
import { useState, useEffect } from 'react';

export default function SendContactRequest() {
  const [form, setForm] = useState({ fromEmail: '',subject: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/contact/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form }),
    });

    const data = await res.json();
    if (res.ok) alert('Message sent!');
    else alert(data.message || 'Failed to send');
  };

  return (
    <main className="flex items-center justify-center mt-30 text-white px-4">
      <form onSubmit={handleSubmit} className="bg-[#1e1e1e] p-8 rounded-xl max-w-lg w-full space-y-4 border border-white/20">
        <h1 className="text-xl font-bold">Contact</h1>
                <input
          type="email"
          className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded"
          placeholder="Email"
          value={form.fromEmail}
          onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
          required
        />
        <input
          type="text"
          className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded"
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          required
        />
        <textarea
          className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded h-40"
          placeholder="Your message..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
        />
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold">
          Send
        </button>
      </form>
    </main>
  );
}
