'use client';

import { useState } from 'react';
import axios from 'axios';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');

    try {
      const res = await axios.post('/api/auth/reset-password', {
        email,
        newPassword,
      });
      setStatus(res.data.message || 'Password reset successfully');
        setTimeout(() => {
            window.location.href = '/auth/login'; // Redirect to login after success
        }, 1500);
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-white px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">🔐 Reset Password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded bg-white/20 text-white border border-white/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded bg-white/20 text-white border border-white/30"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-white font-semibold"
          >
            Reset Password
          </button>
        </form>

        {status && (
          <p className="mt-4 text-center text-sm text-yellow-300">{status}</p>
        )}
      </div>
    </main>
  );
}
