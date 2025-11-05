'use client';

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [status, setStatus] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('User', JSON.stringify(data));
      if (data.role !== "User") {
        window.location.href = '/hub/'
      } else {
        window.location.href = '/me/'
      };
    } catch (err) {
      alert(err.message);
      console.error('Login failed:', err);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setStatus('Sending reset email...');

    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');

      setStatus('✅ Reset code sent to your email.');

      setTimeout(() => {
        window.location.href = '/auth/reset-password';
        setShowResetForm(false);
        setStatus('');
      }, 2000);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center">
      <form
        onSubmit={showResetForm ? handleReset : handleLogin}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-10 max-w-sm w-full shadow-lg border border-white/20 text-white space-y-6"
      >
        <button
          type="button"
          onClick={() => window.history.back()}
          className="text-sm text-blue-400 hover:underline mb-2"
        >
          ← Go Back
        </button>

        <h1 className="text-3xl font-bold">
          {showResetForm ? '🔁 Reset Password' : '🔐 Hub Login'}
        </h1>

        <div class="relative">
          <input
            type="text"
            id="email"
            placeholder=" "
            class="peer block w-full rounded-md border border-gray-500/30 bg-transparent px-3 pt-5 pb-2 text-sm text-white placeholder-transparent focus:border-blue-500 focus:outline-none focus:ring-0"
          />
          <label
            for="email"
            class="absolute left-3 top-2.5 text-sm text-gray-400 transition-all duration-200
           peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-sm
           peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-400"
          >
            Email
          </label>
        </div>


        {!showResetForm && (
        <div class="relative">
  <input
    type="password"
    id="password"
    placeholder=" "
    class="peer block w-full rounded-md border border-gray-500/30 bg-transparent px-3 pt-5 pb-2 text-sm text-white placeholder-transparent focus:border-blue-500 focus:outline-none focus:ring-0"
  />
  <label
    for="password"
    class="absolute left-3 top-2.5 text-sm text-gray-400 transition-all duration-200
           peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-sm
           peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-400"
  >
    Password
  </label>
</div>
        )}

        <button
          type="submit"
          className="w-full bg-white/20 hover:bg-white/30 px-4 py-2 rounded font-semibold transition"
        >
          {showResetForm ? 'Send Reset Code' : 'Login'}
        </button>

        <div className="flex justify-center gap mt-4">
          <button
            type="button"
            onClick={() => {
              setShowResetForm(!showResetForm);
              setStatus('');
            }}
            className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded transition"
          >
            {showResetForm ? '← Back to Login' : 'Forgot Password?'}
          </button>
        </div>

        {status && <p className="text-sm text-yellow-300 text-center">{status}</p>}
      </form>
    </main>
  );
}
