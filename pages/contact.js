'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Mail, HelpCircle, Bug, FileText, Users } from 'lucide-react';

export default function SendContactRequest() {
  const [form, setForm] = useState({ fromEmail: '', subject: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/contact/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) alert('Message sent!');
    else alert(data.message || 'Failed to send');
  };

  const contacts = [
    {
      icon: <Mail className="w-5 h-5 text-blue-400" />,
      email: 'help@flatstudios.net',
      title: 'General Enquiries',
      desc: 'Use for general questions and requests.',
    },
    {
      icon: <HelpCircle className="w-5 h-5 text-green-400" />,
      email: 'development@flatstudios.net',
      title: 'Development Inquiries',
      desc: 'Regarding sourcing of assets and staffing queries..',
    },
    {
      icon: <Bug className="w-5 h-5 text-red-400" />,
      email: 'hiring@flatstudios.net',
      title: 'Hiring Inquiries',
      desc: 'More info about roles and the process.',
    },
    {
      icon: <FileText className="w-5 h-5 text-purple-400" />,
      email: 'ownership@flatstudios.net',
      title: 'Ownership',
      desc: 'Report staff memmbers or business relations.',
    },
  ];

  return (
    <main className="flex items-center justify-center text-white px-6 py-10">
      <div className="grid md:grid-cols-2 gap-10 max-w-6xl w-full">
        {/* ✉️ Contact Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-lg space-y-5"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-sm text-gray-300">Send us a message and we’ll get back to you shortly.</p>

          <input
            type="email"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Your email"
            value={form.fromEmail}
            onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
            required
          />
          <input
            type="text"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
          />
          <textarea
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none h-40 resize-none"
            placeholder="Your message..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 rounded-xl font-semibold shadow-md transition-all duration-200"
          >
            Send Message
          </button>
        </motion.form>

        {/* 📬 Contact Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-lg"
        >
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            Contact Directory
          </h2>
          <p className="text-sm text-gray-300 mb-6">
            Reach the right department directly for faster responses.
          </p>
          <div className="space-y-5">
            {contacts.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/40 transition-all duration-200"
              >
                <div className="mt-1">{c.icon}</div>
                <div>
                  <h3 className="font-semibold text-lg">{c.title}</h3>
                  <p className="text-sm text-gray-400">{c.desc}</p>
                  <p className="text-sm mt-1 text-blue-400 font-mono">{c.email}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
