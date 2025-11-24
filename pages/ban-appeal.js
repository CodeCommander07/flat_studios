'use client';

import { useState } from 'react';
import axios from 'axios';

export default function BanAppealsPage() {
  const [form, setForm] = useState({
    email: '',
    DiscordUsername: '',
    DiscordId: '',
    RobloxUsername: '',
    RobloxId: '',
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
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  if (submitted) {
    return (
      <main className="flex h-screen items-center justify-center text-white">
        <div className="bg-[#283335]/80 backdrop-blur-md border border-white/10 p-10 rounded-xl max-w-xl text-center shadow-lg">
          <h1 className="text-3xl font-bold mb-4">✅ Appeal Submitted</h1>
          <p className="text-white/80">
            Thank you. We’ll review your appeal and respond shortly.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex justify-center items-center py-10 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-[#283335]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg max-w-6xl w-full py-4 px-6 grid md:grid-cols-2 gap-8"
      >
        {/* Title */}
        <div className="md:col-span-2 text-center mb-2">
          <h1 className="text-3xl font-bold mb-2">Ban Appeal Form</h1>
          <p className="text-white/70 text-sm">
            Fill out all fields carefully to ensure a faster response.
          </p>
        </div>

        {/* LEFT COLUMN */}
        <div className="space-y-5">
          {/* Email */}
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-2 rounded-md bg-[#283335] border border-white/20 placeholder-white/50 focus:ring-1 focus:ring-blue-500 outline-none transition"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Roblox */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Roblox Username</label>
              <input
                type="text"
                name="RobloxUsername"
                className="w-full px-4 py-2 rounded-md bg-[#283335] border border-white/20 placeholder-white/50 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="RobloxUsername123"
                value={form.RobloxUsername}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Roblox ID</label>
              <input
                type="text"
                name="RobloxId"
                className="w-full px-4 py-2 rounded-md bg-[#283335] border border-white/20 placeholder-white/50 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="1234567890"
                value={form.RobloxId}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Discord */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Discord Username</label>
              <input
                type="text"
                name="DiscordUsername"
                className="w-full px-4 py-2 rounded-md bg-[#283335] border border-white/20 placeholder-white/50 focus:ring-1 focus:ring-blue-500 outline-none"
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
                className="w-full px-4 py-2 rounded-md bg-[#283335] border border-white/20 placeholder-white/50 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="123456789012345678"
                value={form.DiscordId}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Ban info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Ban Date</label>
              <input
                type="date"
                name="banDate"
                className="w-full px-4 py-2 rounded-md bg-[#283335] border border-white/20 focus:ring-1 focus:ring-blue-500 outline-none"
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
                className="w-full px-4 py-2 rounded-md bg-[#283335] border border-white/20 placeholder-white/50 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Staff Username"
                value={form.staffMember}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div>
            <label className="block mb-1 font-medium">Reason for Ban</label>
            <textarea
              name="banReason"
              rows="5"
              className="w-full px-4 py-2 rounded-md bg-[#283335] border border-white/20 placeholder-white/50 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              placeholder="What were you banned for?"
              value={form.banReason}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Why Should We Unban You?</label>
            <textarea
              name="unbanReason"
              rows="7"
              className="w-full px-4 py-2 rounded-md bg-[#283335] border border-white/20 placeholder-white/50 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              placeholder="Explain your side and why you believe you should be unbanned."
              value={form.unbanReason}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="md:col-span-2 text-center pt-2 pb-2">
          {error && <p className="text-red-400 mb-2">{error}</p>}
          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-md font-semibold shadow-md transition"
          >
            Submit Appeal
          </button>
        </div>
      </form>
    </main>
  );
}
