'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function RegisterPage() {
  const params = useSearchParams();
  const email = params.get('email') || '';
  const role = params.get('role') || 'User';
  const code = params.get('code') || '';

  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [errors, setErrors] = useState({});

  const validatePassword = (pwd) => {
    const strength = {
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };
    return strength;
  };

  useEffect(() => {
    const strength = validatePassword(password);
    const passed = Object.values(strength).filter(Boolean).length;

    if (password.length === 0) {
      setPasswordStrength('');
    } else if (passed <= 2) {
      setPasswordStrength('Weak');
    } else if (passed === 3 || passed === 4) {
      setPasswordStrength('Medium');
    } else {
      setPasswordStrength('Strong');
    }
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (password !== confirmPassword) newErrors.confirm = 'Passwords do not match.';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, role, code, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      localStorage.setItem('User', JSON.stringify(data.safeUser));
      setTimeout(() => (window.location.href = '/hub/'), 5000);
    } else {
      setMessage(`❌ ${data.message || 'Error creating account'}`);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="bg-green-600/20 backdrop-blur-md p-10 rounded-2xl shadow-xl border border-green-600/40 text-center">
          <h1 className="text-3xl font-bold mb-4">🎉 Account Created!</h1>
          <p className="text-lg">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-30 flex items-center justify-center text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-[#283335] backdrop-blur-md p-10 rounded-2xl max-w-3xl w-full shadow-lg border border-white/20"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Register</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label>Email (Not Editable)</label>
            <input value={email} disabled className="w-full bg-[#283335] p-2 rounded mt-1" />
            <label className="mt-4 block">Role (Not Editable)</label>
            <input value={role} disabled className="w-full bg-[#283335] p-2 rounded mt-1" />
          </div>

          <div>
            <label>Username</label>
            <input type="text" value={username}
              onChange={(e) => setUsername(e.target.value)} placeholder="Set a username" className="w-full bg-[#283335] p-2 rounded mt-1" />

            <label className="mt-4 block">Password</label>
            <input
              type="password"
              className="w-full bg-[#283335] p-2 rounded mt-1"
              placeholder="Set a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}

            <label className="mt-4 block">Confirm Password</label>
            <input
              type="password"
              className="w-full bg-[#283335] p-2 rounded mt-1"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {errors.confirm && <p className="text-red-400 text-sm mt-1">{errors.confirm}</p>}

            {password && (
              <div className="mt-3 text-sm">
                <p>
                  Strength:{' '}
                  <span
                    className={`font-bold ${passwordStrength === 'Weak'
                      ? 'text-red-400'
                      : passwordStrength === 'Medium'
                        ? 'text-yellow-400'
                        : 'text-green-400'
                      }`}
                  >
                    {passwordStrength}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold"
        >
          Create Account
        </button>

        {message && <p className="text-center mt-4 text-sm">{message}</p>}
      </form>
    </main>
  );
}
