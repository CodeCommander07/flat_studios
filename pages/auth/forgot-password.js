'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, XCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send reset link.');

      setSent(true);
      setStatus('✅ Reset email sent! Please check your inbox.');
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#283335] backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8 text-center"
      >
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex flex-col items-center space-y-2 mb-6">
                <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Mail className="text-blue-400 w-6 h-6" />
                </div>
                <h1 className="text-2xl font-semibold">Forgot your password?</h1>
                <p className="text-white/70 text-sm max-w-[280px]">
                  Enter your email address and we’ll send you a password reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <input
                    type="email"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="peer w-full rounded-lg border border-white/20 bg-white/5 px-3 pt-5 pb-2 text-sm text-white placeholder-transparent focus:border-blue-400 focus:outline-none focus:ring-0 transition-all duration-300"
                  />
                  <label
                    className="absolute left-3 top-3 text-sm text-white/60 transition-all duration-300 ease-in-out
                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/40
                    peer-focus:-translate-y-2 peer-focus:text-xs peer-focus:text-blue-300"
                  >
                    Email Address
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition rounded-lg py-2 font-medium"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              {status && (
                <p className="text-sm mt-4 text-yellow-300">{status}</p>
              )}

              <div className="mt-6 text-sm">
                <Link
                  href="/auth"
                  className="text-blue-300 hover:text-blue-400 transition"
                >
                  ← Back to Login
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center space-y-4"
            >
              <CheckCircle2 className="text-green-400 w-16 h-16" />
              <h2 className="text-2xl font-semibold">Check your inbox!</h2>
              <p className="text-sm text-white/70 max-w-[260px]">
                If your email is registered, we’ve sent you a link to reset your
                password.
              </p>
              <Link
                href="/auth"
                className="mt-4 bg-blue-600 hover:bg-blue-700 transition rounded-lg px-6 py-2 text-sm font-medium"
              >
                Back to Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
