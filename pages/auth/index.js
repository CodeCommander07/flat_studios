'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthPage() {
  const params = useSearchParams();
  const emailParam = params.get('email') || '';
  const roleParam = params.get('role') || 'User';

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  // ✅ Password strength indicator
  useEffect(() => {
    if (!password) return setPasswordStrength('');
    const rules = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
    const score = Object.values(rules).filter(Boolean).length;
    setPasswordStrength(score <= 2 ? 'Weak' : score <= 4 ? 'Medium' : 'Strong');
  }, [password]);

  // ✅ Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus('Logging in...');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('User', JSON.stringify(data));
      window.location.href = data.role !== 'User' ? '/hub/' : '/me/';
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  // ✅ Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus('Creating account...');
    if (password !== confirmPassword) return setStatus('❌ Passwords do not match.');
    if (password.length < 8) return setStatus('❌ Password must be at least 8 characters.');

    try {
      const res = await fetch('/api/auth/user-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, role: roleParam, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      localStorage.setItem('User', JSON.stringify(data.safeUser));
      setStatus('✅ Account created! Redirecting...');
      setTimeout(() => {
        window.location.href = data.role !== 'User' ? '/hub/' : '/me/';
      }, 3000);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen text-white p-6">
      <div className="relative w-[850px] h-[600px] bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
        {/* Forms container */}
        <div
          className={`absolute inset-0 flex transition-transform duration-700 ease-in-out ${
            isSignup ? '-translate-x-1/2' : ''
          }`}
          style={{ width: '200%' }}
        >
          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="flex flex-col justify-center items-center w-[425px] ml-[425px] px-10 space-y-6"
          >
            <h2 className="text-3xl font-semibold">Welcome Back 👋</h2>
            <p className="text-white/60 text-sm">Log in to continue</p>

            <div className="relative w-full">
              <input
                type="email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full rounded-lg border border-white/20 bg-white/5 px-3 pt-5 pb-2 text-sm text-white placeholder-transparent focus:border-blue-400 focus:outline-none focus:ring-0 transition-all duration-300"
              />
              <label
                className="absolute left-3 top-3 text-sm text-white/60 transition-all duration-300 ease-in-out
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/40
                peer-focus:-translate-y-2 peer-focus:text-xs peer-focus:text-blue-300"
              >
                Email
              </label>
            </div>

            <div className="relative w-full">
              <input
                type="password"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full rounded-lg border border-white/20 bg-white/5 px-3 pt-5 pb-2 text-sm text-white placeholder-transparent focus:border-blue-400 focus:outline-none focus:ring-0 transition-all duration-300"
              />
              <label
                className="absolute left-3 top-3 text-sm text-white/60 transition-all duration-300 ease-in-out
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/40
                peer-focus:-translate-y-2 peer-focus:text-xs peer-focus:text-blue-300"
              >
                Password
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-lg py-2 font-medium"
            >
              Login
            </button>
          </form>

          {/* Signup Form */}
          <form
            onSubmit={handleRegister}
            className="flex flex-col justify-center items-center w-[425px] mr-[425px] px-10 space-y-6"
          >
            <h2 className="text-3xl font-semibold">Create Account ✨</h2>
            <p className="text-white/60 text-sm">Join the Hub</p>

            <div className="relative w-full">
              <input
                type="text"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="peer w-full rounded-lg border border-white/20 bg-white/5 px-3 pt-5 pb-2 text-sm text-white placeholder-transparent focus:border-emerald-400 focus:outline-none focus:ring-0 transition-all duration-300"
              />
              <label
                className="absolute left-3 top-3 text-sm text-white/60 transition-all duration-300 ease-in-out
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/40
                peer-focus:-translate-y-2 peer-focus:text-xs peer-focus:text-emerald-300"
              >
                Username
              </label>
            </div>

            <div className="relative w-full">
              <input
                type="email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full rounded-lg border border-white/20 bg-white/5 px-3 pt-5 pb-2 text-sm text-white placeholder-transparent focus:border-emerald-400 focus:outline-none focus:ring-0 transition-all duration-300"
              />
              <label
                className="absolute left-3 top-3 text-sm text-white/60 transition-all duration-300 ease-in-out
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/40
                peer-focus:-translate-y-2 peer-focus:text-xs peer-focus:text-emerald-300"
              >
                Email
              </label>
            </div>

            <div className="relative w-full">
              <input
                type="password"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full rounded-lg border border-white/20 bg-white/5 px-3 pt-5 pb-2 text-sm text-white placeholder-transparent focus:border-emerald-400 focus:outline-none focus:ring-0 transition-all duration-300"
              />
              <label
                className="absolute left-3 top-3 text-sm text-white/60 transition-all duration-300 ease-in-out
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/40
                peer-focus:-translate-y-2 peer-focus:text-xs peer-focus:text-emerald-300"
              >
                Password
              </label>
            </div>

            <div className="relative w-full">
              <input
                type="password"
                placeholder=" "
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="peer w-full rounded-lg border border-white/20 bg-white/5 px-3 pt-5 pb-2 text-sm text-white placeholder-transparent focus:border-emerald-400 focus:outline-none focus:ring-0 transition-all duration-300"
              />
              <label
                className="absolute left-3 top-3 text-sm text-white/60 transition-all duration-300 ease-in-out
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/40
                peer-focus:-translate-y-2 peer-focus:text-xs peer-focus:text-emerald-300"
              >
                Confirm Password
              </label>
            </div>

            {password && (
              <p className="text-xs text-white/70">
                Strength:{' '}
                <span
                  className={`font-bold ${
                    passwordStrength === 'Weak'
                      ? 'text-red-400'
                      : passwordStrength === 'Medium'
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}
                >
                  {passwordStrength}
                </span>
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 transition rounded-lg py-2 font-medium"
            >
              Register
            </button>
          </form>
        </div>

        {/* Sliding Overlay */}
        <div
          className={`absolute top-0 left-0 h-full w-1/2 transition-all duration-700 ease-in-out ${
            isSignup
              ? 'translate-x-full bg-gradient-to-br from-emerald-500 to-teal-500'
              : 'bg-gradient-to-br from-blue-600 to-purple-600'
          } flex flex-col items-center justify-center text-center p-8`}
        >
          <h2 className="text-3xl font-semibold mb-3">
            {isSignup ? 'Welcome Back!' : 'New Here?'}
          </h2>
          <p className="text-sm text-white/90 mb-6 max-w-[240px]">
            {isSignup
              ? 'Already have an account? Log in to continue.'
              : 'Don’t have an account yet? Create one now!'}
          </p>
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="rounded-full border border-white/30 px-6 py-2 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </div>

        {/* Status */}
        {status && (
          <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-yellow-300">
            {status}
          </p>
        )}
      </div>
    </main>
  );
}
