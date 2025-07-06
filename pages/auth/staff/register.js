'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function RegisterPage() {
  const params = useSearchParams();
  const email = params.get('email') || '';
  const role = params.get('role') || 'User';
  const code = params.get('code') || '';

  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/auth/staff/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, role, code, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage('✅ Account created! You can now log in.');
      setTimeout(() => (window.location.href = '/auth/login'), 1500);
    } else {
      setMessage(`❌ ${data.message || 'Error creating account'}`);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md p-10 rounded-2xl max-w-sm w-full shadow-lg border border-white/20 text-white space-y-6"
      >
        <h1 className="text-3xl font-bold">Register</h1>
        <div>
          <label className="block text-sm text-white/70 mb-1">Email (Not Editable)</label>
          <input value={email} disabled className="w-full bg-white/10 p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">Role (Not Editable)</label>
          <input value={role} disabled className="w-full bg-white/10 p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">Username</label>
          <input type="text" placeholder="Set a username" 
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-white/10 p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">Password</label>
        <input
          type="password"
          placeholder="Set a password"
          className="w-full p-2 rounded bg-white/10"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        </div>
                <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="newsletter"
            className="mr-2"
            defaultChecked
          />
          <label htmlFor="newsletter" className="text-sm text-white/70">
            Subscribe to newsletter
          </label>
        </div>
        <button className="w-full bg-white/20 hover:bg-white/30 py-2 rounded">Create Account</button>
        {message && <p className="text-sm">{message}</p>}
      </form>
    </main>
  );
}
