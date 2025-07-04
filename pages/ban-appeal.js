'use client';

import { useState } from 'react';
import axios from 'axios';

export default function BanAppealsPage() {
  const [form, setForm] = useState({
    email: '',
    DiscordUsername: '',
    DiscordId: '',
    RobloxUsername: '',
    banDate: '',
    banReason: '',
    staffMember: '',
    unbanReason: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('/api/appeals', form);
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  if (submitted) {
    return (
      <main className="flex py-60 items-center justify-center text-white">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-xl max-w-xl text-center">
          <h1 className="text-3xl font-bold mb-4">✅ Appeal Submitted</h1>
          <p className="text-white/80">Thank you. We’ll review your appeal and respond shortly.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="py-10 px-4 flex justify-center text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-lg max-w-3xl w-full space-y-6"
      >
        <h1 className="text-3xl font-bold text-center">🛑 Ban Appeal Form</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Roblox Username</label>
            <input
              type="text"
              name="RobloxUsername"
              className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50"
              placeholder="RobloxUsername123"
              value={form.RobloxUsername}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Discord Username</label>
            <input
              type="text"
              name="DiscordUsername"
              className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50"
              placeholder="Username#0000"
              value={form.DiscordUsername}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Discord ID</label>
            <input
              type="text"
              name="DiscordId"
              className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50"
              placeholder="123456789012345678"
              value={form.DiscordId}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Ban Date</label>
            <input
              type="date"
              name="banDate"
              className="w-full px-4 py-2 rounded bg-white/10 border border-white/20"
              value={form.banDate}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Staff Member Who Banned You</label>
            <input
              type="text"
              name="staffMember"
              className="w-full px-4 py-2 rounded bg-white/10 border border-white/20"
              placeholder="Staff Username"
              value={form.staffMember}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium">Reason for Ban</label>
          <textarea
            name="banReason"
            rows="3"
            className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50"
            placeholder="What were you banned for?"
            value={form.banReason}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Why Should We Unban You?</label>
          <textarea
            name="unbanReason"
            rows="4"
            className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50"
            placeholder="Explain your side and why you believe you should be unbanned."
            value={form.unbanReason}
            onChange={handleChange}
          />
        </div>

        {error && <p className="text-red-400">{error}</p>}

        <div className="text-center">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition"
          >
            Submit Appeal
          </button>
        </div>
      </form>
    </main>
  );
}
