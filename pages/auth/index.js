'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [strength, setStrength] = useState(0);
  const [criteria, setCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  // ✅ Password strength validation
  useEffect(() => {
    const rules = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
    setCriteria(rules);
    setStrength(Object.values(rules).filter(Boolean).length);
  }, [password]);

  const strengthLabel =
    strength <= 2 ? 'Weak' : strength <= 4 ? 'Medium' : 'Strong';
  const strengthColor =
    strength <= 2 ? 'bg-red-500' : strength <= 4 ? 'bg-yellow-400' : 'bg-green-500';

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
    if (password !== confirmPassword)
      return setStatus('❌ Passwords do not match.');
    if (strength < 5)
      return setStatus('❌ Password is too weak. Make it stronger.');

    setStatus('Creating account...');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, role: roleParam, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      localStorage.setItem('User', JSON.stringify(data.safeUser));
      setStatus('✅ Account created! Redirecting...');
      setTimeout(() => {
        window.location.href = data.role === 'User' ? '/me/' : '/hub/';
      }, 2500);
    } catch (err) {
      setStatus(`❌ ${err.message}`);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen text-white p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-5xl bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row transition-all duration-700"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isSignup ? 'signup' : 'login'}
            initial={{ opacity: 0, x: isSignup ? 80 : -80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isSignup ? -80 : 80 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex-1 flex flex-col justify-center items-center p-8 sm:p-10"
          >
            {isSignup ? (
              <motion.form
                onSubmit={handleRegister}
                className="w-full max-w-sm flex flex-col space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h2 className="text-3xl font-semibold text-center">Create Account ✨</h2>
                <p className="text-white/60 text-sm text-center">Join the Hub</p>

                <InputField
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  color="emerald"
                />
                <InputField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  color="emerald"
                />
                <InputField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  color="emerald"
                />
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
                  <AnimatePresence mode="wait">
                    {confirmPassword && (
                      <motion.div
                        key={password === confirmPassword ? 'match' : 'no-match'}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute right-3 top-3 text-lg font-bold ${password === confirmPassword ? 'text-green-400' : 'text-red-400'
                          }`}
                      >
                        {password === confirmPassword ? '✔' : '✖'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {password && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-2 ${strengthColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(strength / 5) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-white/70 text-center">
                      Strength: <span className="font-bold">{strengthLabel}</span>
                    </p>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                  {[...Object.entries(criteria), ['match', password === confirmPassword && confirmPassword !== '']].map(
                    ([key, valid]) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2"
                      >
                        <motion.span
                          key={valid ? `${key}-check` : `${key}-cross`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className={`text-sm font-bold ${valid ? 'text-green-400' : 'text-red-400'
                            }`}
                        >
                          {valid ? '✔' : '✖'}
                        </motion.span>

                        <span className={valid ? 'text-white/80' : 'text-white/50'}>
                          {key === 'length'
                            ? 'At least 8 chars'
                            : key === 'upper'
                              ? 'Uppercase letter'
                              : key === 'lower'
                                ? 'Lowercase letter'
                                : key === 'number'
                                  ? 'Number'
                                  : key === 'special'
                                    ? 'Special character'
                                    : key === 'match'
                                      ? 'Passwords match'
                                      : ''}
                        </span>
                      </motion.div>
                    )
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={
                    strength < 5 || password !== confirmPassword || !username || !email
                  }
                  className={`w-full transition rounded-lg py-2 font-medium ${strength < 5 || password !== confirmPassword
                    ? 'bg-emerald-800/40 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
                >
                  Register
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                onSubmit={handleLogin}
                className="w-full max-w-sm flex flex-col space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h2 className="text-3xl font-semibold text-center">Welcome Back 👋</h2>
                <p className="text-white/60 text-sm text-center">Log in to continue</p>

                <InputField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  color="blue"
                />
                <InputField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  color="blue"
                />

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-300 hover:text-blue-400 transition"
                  >
                    Forgot password?
                  </Link>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-lg py-2 font-medium"
                >
                  Login
                </motion.button>
              </motion.form>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Overlay */}
        <motion.div
          key={isSignup ? 'signupOverlay' : 'loginOverlay'}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`flex-1 flex flex-col justify-center items-center p-8 sm:p-10 text-center transition-all duration-700 ease-in-out ${isSignup
            ? 'bg-gradient-to-br from-blue-600 to-purple-600'
            : 'bg-gradient-to-br from-emerald-500 to-teal-500'
            }`}
        >
          <h2 className="text-3xl font-semibold mb-3">
            {isSignup ? 'Welcome Back!' : 'New Here?'}
          </h2>
          <p className="text-sm text-white/90 mb-6 max-w-[260px]">
            {isSignup
              ? 'Already have an account? Log in to continue.'
              : 'Don’t have an account yet? Create one now!'}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsSignup(!isSignup)}
            className="rounded-full border border-white/30 px-6 py-2 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            {isSignup ? 'Login' : 'Sign Up'}
          </motion.button>
        </motion.div>

        {/* Status Message */}
        <AnimatePresence>
          {status && (
            <motion.p
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-4 left-0 right-0 text-center text-sm text-yellow-300"
            >
              {status}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}

/* ✅ Reusable Input Component */
function InputField({ label, type, value, onChange, color }) {
  const focusColor =
    color === 'emerald'
      ? 'focus:border-emerald-400 peer-focus:text-emerald-300'
      : 'focus:border-blue-400 peer-focus:text-blue-300';

  return (
    <div className="relative w-full">
      <input
        type={type}
        placeholder=" "
        value={value}
        onChange={onChange}
        required
        className={`peer w-full rounded-lg border border-white/20 bg-white/5 px-3 pt-5 pb-2 text-sm text-white placeholder-transparent focus:outline-none focus:ring-0 transition-all duration-300 ${focusColor}`}
      />
      <label
        className={`absolute left-3 top-3 text-sm text-white/60 transition-all duration-300 ease-in-out
        peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/40
        peer-focus:-translate-y-2 peer-focus:text-xs ${focusColor}`}
      >
        {label}
      </label>
    </div>
  );
}
