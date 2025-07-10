'use client';

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
    window.location.href = '/hub/';
  } catch (err) {
    alert(err.message);
    console.error('Login failed:', err);
  }
};


  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center">
<form
  onSubmit={handleLogin}
  className="bg-white/10 backdrop-blur-md rounded-2xl p-10 max-w-sm w-full shadow-lg border border-white/20 text-white space-y-6"
>
  <button
    type="button"
    onClick={() => window.history.back()}
    className="text-sm text-blue-400 hover:underline mb-2"
  >
    ← Go Back
  </button>

  <h1 className="text-3xl font-bold">🔐 Hub Login</h1>


        <div className="text-left w-full space-y-2">
          <label className="block font-medium">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
            placeholder="example@example.example"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="text-left w-full space-y-2">
          <label className="block font-medium">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-white/20 hover:bg-white/30 px-4 py-2 rounded font-semibold transition"
        >
          Login
        </button>
<div className="flex justify-center gap mt-4">
  <a
    href="/auth/reset-password"
    className="px-4 py-2 rounded-l text-sm text-white bg-red-500 hover:bg-red-600 transition"
  >
    Forgot Password?
  </a>
</div>


      </form>
    </main>
  );
}
