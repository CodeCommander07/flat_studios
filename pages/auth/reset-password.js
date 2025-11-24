'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');

  // Password strength logic
  const criteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const strength = Object.values(criteria).filter(Boolean).length;

  const strengthColor =
    strength <= 2 ? 'bg-red-500' :
      strength === 3 ? 'bg-yellow-500' :
        strength === 4 ? 'bg-blue-500' :
          'bg-green-500';

  const strengthLabel =
    strength <= 2 ? 'Weak' :
      strength === 3 ? 'Moderate' :
        strength === 4 ? 'Strong' :
          'Very Strong';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');

    try {
      const res = await axios.post('/api/auth/reset-password', {
        email,
        code,
        newPassword: password,
      });

      setStatus(res.data.message || 'Password reset successfully');
      setTimeout(() => {
        window.location.href = '/auth/';
      }, 1500);
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to reset password');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCode(params.get("token"));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-white px-4">
      <div className="w-full max-w-md bg-[#283335] backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">🔐 Reset Password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input type="hidden" value={code} readOnly />

          {/* EMAIL */}
          <div className="relative w-full">
            <input
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="peer w-full rounded-lg border border-white/20 bg-white/20 px-3 pt-5 pb-2 
               text-sm text-white placeholder-transparent focus:outline-none 
               focus:ring-0 transition-all duration-300"
            />
            <label
              className="
      absolute left-3 top-3 text-sm text-white/60 
      transition-all duration-300 ease-in-out
      peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/40
      peer-focus:-translate-y-2 peer-focus:text-xs peer-focus:text-blue-300
      peer-not-placeholder-shown:-translate-y-2 peer-not-placeholder-shown:text-xs
    "
            >
              Email
            </label>
          </div>

          {/* NEW PASSWORD */}
          <div className="relative w-full">
            <input
              type="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full rounded-lg border border-white/20 bg-white/20 px-3 pt-5 pb-2 
               text-sm text-white placeholder-transparent focus:outline-none 
               focus:ring-0 transition-all duration-300"
            />
            <label
              className="
      absolute left-3 top-3 text-sm text-white/60 
      transition-all duration-300 ease-in-out
      peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/40
      peer-focus:-translate-y-2 peer-focus:text-xs peer-focus:text-blue-300
      peer-not-placeholder-shown:-translate-y-2 peer-not-placeholder-shown:text-xs
    "
            >
              New Password
            </label>
          </div>

          {/* CONFIRM NEW PASSWORD */}
          <div className="relative w-full">
            <input
              type="password"
              placeholder=" "
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="peer w-full rounded-lg border border-white/20 bg-white/20 px-3 pt-5 pb-2 
               text-sm text-white placeholder-transparent focus:outline-none 
               focus:ring-0 transition-all duration-300"
            />
            <label
              className="
      absolute left-3 top-3 text-sm text-white/60 
      transition-all duration-300 ease-in-out
      peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/40
      peer-focus:-translate-y-2 peer-focus:text-xs peer-focus:text-blue-300
      peer-not-placeholder-shown:-translate-y-2 peer-not-placeholder-shown:text-xs
    "
            >
              Confirm New Password
            </label>

            {/* ✔ / ✖ Match Icon */}
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
              <div className="w-full h-2 bg-[#283335] rounded-full overflow-hidden">
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
            {Object.entries(criteria).map(([key, valid]) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <span className={`font-bold ${valid ? 'text-green-400' : 'text-red-400'}`}>
                  {valid ? '✔' : '✖'}
                </span>
                <span>
                  {key === 'length'
                    ? 'At least 8 chars'
                    : key === 'upper'
                      ? 'Uppercase letter'
                      : key === 'lower'
                        ? 'Lowercase letter'
                        : key === 'number'
                          ? 'Number'
                          : 'Special character'}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={
              strength < 5 ||
              password !== confirmPassword ||
              !email
            }
            className={`w-full transition rounded-lg py-2 font-medium ${strength < 5 || password !== confirmPassword
              ? 'bg-blue-800/40 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            Reset Password
          </motion.button>

        </form>

        {status && (
          <p className="mt-4 text-center text-sm text-yellow-300">{status}</p>
        )}
      </div>
    </main>
  );
}
